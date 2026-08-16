import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
    let targetUserId = user.id;

    if (user.role === Role.ADMIN && dto.userId) {
      targetUserId = dto.userId;
    } else if (user.role === Role.GUIDE && dto.customerName && dto.whatsappNumber) {
      // Create a new end-user for this customer
      const newCustomer = await this.prisma.user.create({
        data: {
          name: dto.customerName,
          whatsappNumber: dto.whatsappNumber,
          email: dto.email || `${dto.whatsappNumber.replace(/[^0-9]/g, '')}@guest.morrowotif.com`,
          passwordHash: 'pending_setup',
          role: Role.END_USER,
          referredById: user.id,
        },
      });
      targetUserId = newCustomer.id;
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

    const job = await this.automationQueue.add(
      'generate-drive-link',
      { pictureBookId: pictureBook.id },
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

    await this.prisma.pictureBook.update({
      where: { id: pictureBook.id },
      data: { jobId: job.id?.toString() },
    });

    return pictureBook;
  }

  async findAll(pagination: PaginationDto, user: { id: string; role: Role }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (user.role === Role.END_USER) {
      where = { userId: user.id };
    } else if (user.role === Role.GUIDE) {
      where = { user: { referredById: user.id } };
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
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pictureBook.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
        user: {
          select: { id: true, name: true, email: true, referredById: true },
        },
      },
    });

    if (!pictureBook) throw new NotFoundException('Picture Book not found');

    if (user.role === Role.END_USER && pictureBook.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    if (
      user.role === Role.GUIDE &&
      (pictureBook.user as any).referredById !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return pictureBook;
  }

  async resend(id: string, user: { id: string; role: Role }) {
    const pictureBook = await this.findOne(id, user);

    await this.prisma.pictureBook.update({
      where: { id },
      data: { status: 'REQUESTED' },
    });

    const jobId = `drive-${id}-retry-${Date.now()}`;
    await this.automationQueue.add(
      'generate-drive-link',
      { pictureBookId: id },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return { message: 'Automation job re-queued', pictureBookId: id };
  }

  async getDashboardStats(user: { id: string; role: Role }) {
    let where: any = {};
    if (user.role === Role.END_USER) {
      where = { userId: user.id };
    } else if (user.role === Role.GUIDE) {
      where = { user: { referredById: user.id } };
    }

    const [total, active, pending, failed] = await Promise.all([
      this.prisma.pictureBook.count({ where }),
      this.prisma.pictureBook.count({ where: { ...where, status: 'READY' } }),
      this.prisma.pictureBook.count({
        where: { ...where, status: 'REQUESTED' },
      }),
      this.prisma.pictureBook.count({
        where: { ...where, status: 'CANCELLED' },
      }),
    ]);

    return {
      totalPictureBooks: total,
      readyPictureBooks: active,
      requestedPictureBooks: pending,
      cancelledPictureBooks: failed,
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

    const jobId = `manual-drive-${id}-${Date.now()}`;
    await this.automationQueue.add(
      'generate-drive-link',
      { pictureBookId: id },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

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
}
