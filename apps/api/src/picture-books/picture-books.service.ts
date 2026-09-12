import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePictureBookDto } from './dto/create-picture-book.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PictureBooksService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('google-drive') private automationQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePictureBookDto, user: { id: string; role: Role }) {
    try {
      let targetUserId = user.id;

      if (user.role === Role.ADMIN && dto.userId) {
        targetUserId = dto.userId;
      }

      const pictureBook = await this.prisma.pictureBook.create({
        data: {
          userId: targetUserId,
          title: dto.title,
          status: 'REQUESTED',
          deliveryPreference: dto.deliveryPreference,
          departureDate: dto.departureDate ? new Date(dto.departureDate) : null,
          departureTime: dto.departureTime,
          flightNumber: dto.flightNumber,
          departureAirport: dto.departureAirport,
          deliveryAddressLine1: dto.deliveryAddressLine1,
          deliveryAddressLine2: dto.deliveryAddressLine2,
          deliveryCity: dto.deliveryCity,
          deliveryState: dto.deliveryState,
          deliveryPostalCode: dto.deliveryPostalCode,
          deliveryCountry: dto.deliveryCountry,
        },
      });

      if (dto.deliveryPreference === 'HOME_DELIVERY' && dto.deliveryAddressLine1) {
        const userRec = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (userRec && !userRec.addressLine1) {
          await this.prisma.user.update({
            where: { id: targetUserId },
            data: {
              addressLine1: dto.deliveryAddressLine1,
              addressLine2: dto.deliveryAddressLine2,
              city: dto.deliveryCity,
              state: dto.deliveryState,
              postalCode: dto.deliveryPostalCode,
              country: dto.deliveryCountry,
            },
          });
        }
      }

      const automationJob = await this.prisma.automationJob.create({
        data: {
          pictureBookId: pictureBook.id,
          automationType: 'DRIVE_GENERATION',
          status: 'QUEUED',
        }
      });

      const job = await this.automationQueue.add(
        'generate-drive-link',
        { pictureBookId: pictureBook.id, automationJobId: automationJob.id },
        {
          jobId: `drive-${pictureBook.id}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

      await this.prisma.automationJob.update({
        where: { id: automationJob.id },
        data: { jobId: job.id?.toString() }
      });

      await this.prisma.pictureBook.update({
        where: { id: pictureBook.id },
        data: { jobId: job.id?.toString(), driveStatus: 'QUEUED', driveError: null },
      });

      return pictureBook;
    } catch (e: any) {
      throw new BadRequestException('We could not create the Picture Book. Please try again.');
    }
  }

  async findAll(pagination: PaginationDto, user: { id: string; role: Role }) {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      let where: any = {};
      if (user.role === Role.END_USER) {
        where = { userId: user.id };
      } else if (user.role === Role.GUIDE) {
        throw new ForbiddenException('Guides do not have access to Picture Books');
      }

      const [data, total] = await Promise.all([
        this.prisma.pictureBook.findMany({
          where,
          skip,
          take: limit,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            user: {
              select: { id: true, name: true, email: true, whatsappNumber: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.pictureBook.count({ where }),
      ]);

      return {
        data: user.role === Role.END_USER
          ? data.map(({ messages, ...book }) => book)
          : data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (e: any) {
      throw new BadRequestException('DEBUG: ' + e.message);
    }
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const pictureBook = await this.prisma.pictureBook.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
        },
        automationJobs: {
          orderBy: { requestedAt: 'desc' },
        },
        user: {
          select: {
            id: true, name: true, email: true, referredById: true,
            whatsappNumber: true, addressLine1: true, addressLine2: true,
            city: true, state: true, postalCode: true, country: true,
          },
        },
      },
    });

    if (!pictureBook) throw new NotFoundException('Picture Book not found');

    if (user.role === Role.END_USER && pictureBook.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === Role.GUIDE) {
      throw new ForbiddenException('Guides do not have access to Picture Books');
    }

    if (user.role === Role.END_USER) {
      const { messages, activityLogs, automationJobs, ...customerBook } = pictureBook;
      return customerBook;
    }

    return pictureBook;
  }

  async createWhatsappOptIn(
    id: string,
    whatsappNumber: string | undefined,
    user: { id: string; role: Role },
  ) {
    const pictureBook = await this.findOne(id, user);
    const number = (whatsappNumber?.replace(/[^0-9]/g, '') || pictureBook.user.whatsappNumber?.replace(/[^0-9]/g, '')) || undefined;
    if (!number) throw new BadRequestException('A WhatsApp number is required');

    await this.prisma.user.update({
      where: { id: pictureBook.userId },
      data: { whatsappNumber: number },
    });

    const businessNumber = (process.env.WHATSAPP_BUSINESS_NUMBER || '').replace(/[^0-9]/g, '');
    if (!businessNumber) throw new BadRequestException('WhatsApp updates are temporarily unavailable');

    const message = `Update on "${pictureBook.title}"`;
    const link = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    await this.prisma.pictureBook.update({
      where: { id },
      data: { whatsappStatus: 'LINK_GENERATED', whatsappLinkGeneratedAt: new Date() },
    });
    await this.prisma.activityLog.create({
      data: { pictureBookId: id, action: 'WHATSAPP_OPT_IN_LINK_GENERATED', details: 'Customer chose optional WhatsApp updates.' },
    });
    return { link, whatsappStatus: 'LINK_GENERATED' };
  }

  async declineWhatsapp(id: string, user: { id: string; role: Role }) {
    await this.findOne(id, user);
    await this.prisma.pictureBook.update({ where: { id }, data: { whatsappStatus: 'DECLINED' } });
    await this.prisma.activityLog.create({
      data: { pictureBookId: id, action: 'WHATSAPP_DECLINED', details: 'Customer chose to continue without WhatsApp.' },
    });
    return { whatsappStatus: 'DECLINED' };
  }

  async resend(id: string, user: { id: string; role: Role }) {
    const pictureBook = await this.findOne(id, user);

    if (pictureBook.driveStatus === 'QUEUED' || pictureBook.driveStatus === 'PROCESSING') {
      throw new BadRequestException('Automation is already in progress');
    }

    await this.prisma.pictureBook.update({
      where: { id },
      data: { status: 'REQUESTED' },
    });

    const automationJob = await this.prisma.automationJob.create({
      data: {
        pictureBookId: id,
        automationType: 'DRIVE_GENERATION',
        status: 'QUEUED',
      }
    });

    const jobId = `drive-${id}-retry-${Date.now()}`;
    await this.automationQueue.add(
      'generate-drive-link',
      { pictureBookId: id, automationJobId: automationJob.id },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.automationJob.update({
      where: { id: automationJob.id },
      data: { jobId }
    });

    await this.prisma.pictureBook.update({
      where: { id },
      data: { driveStatus: 'QUEUED', driveError: null },
    });

    return { message: 'Automation job re-queued', pictureBookId: id };
  }

  async getDashboardStats(user: { id: string; role: Role }) {
    let where: any = {};
    if (user.role === Role.END_USER) {
      where = { userId: user.id };
    } else if (user.role === Role.GUIDE) {
      throw new ForbiddenException('Guides do not have access to Picture Books');
    }

    const [total, inProgress, completed, attention] = await Promise.all([
      this.prisma.pictureBook.count({ where }),
      this.prisma.pictureBook.count({ 
        where: { 
          ...where, 
          status: { in: ['PHOTOS_UPLOADED', 'UNDER_REVIEW', 'IN_PRODUCTION'] },
        } 
      }),
      this.prisma.pictureBook.count({
        where: { ...where, status: { in: ['READY', 'COMPLETED'] } },
      }),
      this.prisma.pictureBook.count({
        where: { 
          ...where, 
          OR: [
            { status: { in: ['REQUESTED', 'UPLOAD_PENDING', 'CANCELLED'] } },
            { driveStatus: 'FAILED' },
          ] 
        },
      }),
    ]);

    return {
      totalPictureBooks: total,
      inProgressPictureBooks: inProgress,
      completedPictureBooks: completed,
      attentionPictureBooks: attention,
    };
  }

  async updateStatus(
    id: string,
    status: any,
    user: { id: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');

    const pictureBook = await this.prisma.pictureBook.update({
      where: { id },
      data: { status },
    });

    await this.prisma.activityLog.create({
      data: {
        pictureBookId: id,
        action: 'STATUS_UPDATED',
        details: `Status manually updated to ${status}`,
      },
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'UPDATE_PICTURE_BOOK_STATUS',
      resourceType: 'PictureBook',
      resourceId: id,
      status: 'SUCCESS',
      details: { newStatus: status },
    });

    return pictureBook;
  }

  async createDriveLink(id: string, user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');

    const pictureBook = await this.prisma.pictureBook.findUnique({ where: { id } });
    if (!pictureBook) throw new NotFoundException('Picture Book not found');

    if (pictureBook.driveLink || pictureBook.driveStatus === 'SUCCESS') {
      throw new BadRequestException('Drive link already exists for this Picture Book');
    }
    if (pictureBook.driveStatus === 'QUEUED' || pictureBook.driveStatus === 'PROCESSING') {
      throw new BadRequestException('Drive link generation is already in progress');
    }

    const automationJob = await this.prisma.automationJob.create({
      data: {
        pictureBookId: id,
        automationType: 'DRIVE_GENERATION',
        status: 'QUEUED',
      }
    });

    const jobId = `manual-drive-${id}-${Date.now()}`;
    await this.automationQueue.add(
      'generate-drive-link',
      { pictureBookId: id, automationJobId: automationJob.id },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.automationJob.update({
      where: { id: automationJob.id },
      data: { jobId }
    });

    await this.prisma.pictureBook.update({
      where: { id },
      data: { driveStatus: 'QUEUED', driveError: null },
    });

    await this.prisma.activityLog.create({
      data: {
        pictureBookId: id,
        action: 'DRIVE_LINK_REQUESTED',
        details: `Manual Drive link creation requested`,
      },
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'MANUAL_DRIVE_LINK_QUEUED',
      resourceType: 'PictureBook',
      resourceId: id,
      status: 'SUCCESS',
    });

    return { message: 'Drive creation job queued' };
  }

  async cleanupSynthetic(user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');

    // Find all synthetic picture books
    const syntheticBooks = await this.prisma.pictureBook.findMany({
      where: {
        title: {
          startsWith: '[SYNTHETIC]',
        },
      },
    });

    const bookIds = syntheticBooks.map(b => b.id);
    if (bookIds.length === 0) {
      return { message: 'No synthetic data to clean up', deletedCount: 0 };
    }

    // Delete related records first due to foreign keys (ActivityLog, WhatsAppMessage, Message, etc.)
    await this.prisma.activityLog.deleteMany({
      where: { pictureBookId: { in: bookIds } },
    });
    await this.prisma.whatsAppMessage.deleteMany({
      where: { pictureBookId: { in: bookIds } },
    });

    // Finally delete picture books
    const deleted = await this.prisma.pictureBook.deleteMany({
      where: { id: { in: bookIds } },
    });

    return {
      message: 'Synthetic data cleaned up',
      deletedCount: deleted.count,
    };
  }
}
