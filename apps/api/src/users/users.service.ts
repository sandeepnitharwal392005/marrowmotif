import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, user: { id: string; role: Role }) {
    if (user.role === Role.END_USER)
      throw new ForbiddenException('Access denied');

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where = user.role === Role.ADMIN ? {} : { referredById: user.id };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { pictureBooks: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats(user: { id: string; role: Role }) {
    if (user.role !== Role.GUIDE && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const where = user.role === Role.ADMIN ? {} : { referredById: user.id };

    const [totalReferred, pendingRegistration, registered] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({
        where: { ...where, passwordHash: 'pending_setup' },
      }),
      this.prisma.user.count({
        where: { ...where, passwordHash: { not: 'pending_setup' } },
      }),
    ]);

    return {
      totalReferred,
      pendingRegistration,
      registered,
    };
  }

  async search(
    query: string,
    pagination: PaginationDto,
    user: { id: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');

    if (!query || query.trim() === '') {
      return this.findAll(pagination, user);
    }

    const searchTerm = query.trim();

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { email: { contains: searchTerm, mode: 'insensitive' as const } },
        { phone: { contains: searchTerm, mode: 'insensitive' as const } },
        {
          pictureBooks: {
            some: {
              OR: [
                {
                  title: { contains: searchTerm, mode: 'insensitive' as const },
                },
                { id: { equals: searchTerm } },
              ],
            },
          },
        },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { pictureBooks: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user?: { id: string; role: Role }) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        referredById: true,
        referredBy: { select: { id: true, name: true } },
        referrals: { select: { id: true, name: true } },
        pictureBooks: {
          include: {
            // The admin UI uses the first message as the current delivery state,
            // so relation ordering must be explicit rather than database-dependent.
            messages: { orderBy: { createdAt: 'desc' } },
            activityLogs: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' }
        },
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        whatsappNumber: true,
      },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    if (user && user.role !== Role.ADMIN) {
      if (user.role === Role.END_USER && targetUser.id !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      if (
        user.role === Role.GUIDE &&
        targetUser.referredById !== user.id &&
        targetUser.id !== user.id
      ) {
        throw new ForbiddenException('Access denied');
      }
    }

    return targetUser;
  }

  async create(data: CreateUserDto) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        whatsappVerified: false,
        referredById: data.referredById,
        passwordHash,
        role: Role.END_USER,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        whatsappVerified: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !(user as any).isActive },
      select: { id: true, isActive: true },
    });
  }

  async createGuide(data: any) {
    const setupToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const setupTokenExpiry = new Date();
    setupTokenExpiry.setDate(setupTokenExpiry.getDate() + 7); // 7 days

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        whatsappNumber: data.whatsappNumber,
        passwordHash: 'pending-setup',
        role: Role.GUIDE,
        setupToken,
        setupTokenExpiry,
      },
    });

    try {
      const { createProviders } = require('@travel/integrations');
      const providers = createProviders();
      const link = `https://marrowotif-six.vercel.app/setup-account?token=${setupToken}`;

      // Attempt WhatsApp first, fallback to email conceptually (but we only have WhatsApp provider right now)
      if (data.whatsappNumber) {
        await providers.whatsApp.sendTextMessage(
          data.whatsappNumber,
          `Welcome to Marrowmotif, ${data.name}! Set up your Guide account here: ${link}`,
        );
      }
    } catch (err) {
      console.error('Failed to send Guide setup link:', err);
    }

    return { success: true, userId: user.id };
  }

  async referCustomer(data: any, guideId: string) {
    const guide = await this.prisma.user.findUnique({ where: { id: guideId } });
    if (!guide) throw new NotFoundException('Guide not found');

    const customerEmail = data.email || `${data.whatsappNumber.replace(/[^0-9]/g, '')}@guest.marrowotif.com`;
    let customer = await this.prisma.user.findFirst({
      where: { 
        OR: [
          { email: customerEmail },
          { whatsappNumber: data.whatsappNumber }
        ]
      }
    });

    if (!customer) {
      customer = await this.prisma.user.create({
        data: {
          name: data.customerName || data.name,
          whatsappNumber: data.whatsappNumber,
          email: customerEmail,
          passwordHash: 'pending_setup',
          role: Role.END_USER,
          referredById: guide.id,
        },
      });
    }

    try {
      const { createProviders } = require('@travel/integrations');
      const providers = createProviders();
      const link = `https://marrowotif-six.vercel.app/register?ref=${guideId}`;

      await providers.whatsApp.sendTextMessage(
        data.whatsappNumber,
        `Hello ${data.customerName || data.name}! ${guide.name} has invited you to create your Picture Book with Marrowmotif. Register here: ${link}`,
      );
    } catch (err) {
      console.error('Failed to send Referral link:', err);
      // Don't throw 500 if WhatsApp fails, just log it.
    }

    return { success: true, customerId: customer.id };
  }

  async setupAccount(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { setupToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired setup link');
    }

    if (user.setupTokenExpiry && new Date() > user.setupTokenExpiry) {
      throw new ForbiddenException('Setup link has expired');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        setupToken: null,
        setupTokenExpiry: null,
        whatsappVerified: true, // Guides are verified automatically upon setup
      },
    });

    return { success: true };
  }

  async update(id: string, data: any, user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = {
      name: data.name,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        whatsappNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    return updatedUser;
  }
}
