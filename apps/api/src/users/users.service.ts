import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, user: { id: string; role: Role }) {
    if (user.role === Role.END_USER) throw new ForbiddenException('Access denied');

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
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, createdAt: true,
          _count: { select: { pictureBooks: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async search(query: string, pagination: PaginationDto, user: { id: string; role: Role }) {
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
                { title: { contains: searchTerm, mode: 'insensitive' as const } },
                { id: { equals: searchTerm } }
              ]
            }
          }
        }
      ]
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, createdAt: true,
          _count: { select: { pictureBooks: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, user?: { id: string; role: Role }) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, isActive: true, createdAt: true,
        referredById: true,
        referredBy: { select: { id: true, name: true } },
        referrals: { select: { id: true, name: true } },
        addressLine1: true, addressLine2: true, city: true, state: true, postalCode: true, country: true,
      },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    if (user && user.role !== Role.ADMIN) {
      if (user.role === Role.END_USER && targetUser.id !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      if (user.role === Role.GUIDE && targetUser.referredById !== user.id && targetUser.id !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return targetUser;
  }

  async create(data: CreateUserDto) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    let otpCode = null;
    let otpExpiry = null;
    let isWhatsappVerified = true;

    // Generate OTP if End User
    if ((!data.role || data.role === Role.END_USER) && data.whatsappNumber) {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 min expiry
      isWhatsappVerified = false;

      // Send OTP using provider
      try {
        const { createProviders } = require('@travel/integrations');
        const providers = createProviders();
        await providers.whatsApp.sendTextMessage(
          data.whatsappNumber,
          `Your Morrowotif verification code is: ${otpCode}. It expires in 10 minutes.`
        );
      } catch (err) {
        console.error('Failed to send WhatsApp OTP:', err);
      }
    }

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        whatsappVerified: isWhatsappVerified,
        otpCode,
        otpExpiry,
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
        id: true, name: true, email: true, role: true, createdAt: true, whatsappVerified: true
      },
    });
  }

  async verifyOtp(email: string, otpCode: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.whatsappVerified) return { success: true };

    if (!user.otpCode || user.otpCode !== otpCode) {
      // Increment attempts
      await this.prisma.user.update({ where: { id: user.id }, data: { otpAttempts: user.otpAttempts + 1 } });
      throw new ForbiddenException('Invalid OTP');
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      throw new ForbiddenException('OTP has expired');
    }

    if (user.otpAttempts >= 5) {
      throw new ForbiddenException('Too many invalid attempts. Please request a new OTP.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { whatsappVerified: true, otpCode: null, otpExpiry: null, otpAttempts: 0 },
    });

    return { success: true };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.whatsappVerified) return { success: true };
    if (!user.whatsappNumber) throw new ForbiddenException('No WhatsApp number on file');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiry, otpAttempts: 0 },
    });

    try {
      const { createProviders } = require('@travel/integrations');
      const providers = createProviders();
      await providers.whatsApp.sendTextMessage(
        user.whatsappNumber,
        `Your Morrowotif verification code is: ${otpCode}. It expires in 10 minutes.`
      );
    } catch (err) {
      console.error('Failed to send WhatsApp OTP:', err);
    }

    return { success: true };
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
    const setupToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
      const link = `https://morrowotif-six.vercel.app/setup-account?token=${setupToken}`;
      
      // Attempt WhatsApp first, fallback to email conceptually (but we only have WhatsApp provider right now)
      if (data.whatsappNumber) {
        await providers.whatsApp.sendTextMessage(
          data.whatsappNumber,
          `Welcome to Morrowotif, ${data.name}! Set up your Guide account here: ${link}`
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

    try {
      const { createProviders } = require('@travel/integrations');
      const providers = createProviders();
      const link = `https://morrowotif-six.vercel.app/register?ref=${guideId}`;
      
      await providers.whatsApp.sendTextMessage(
        data.whatsappNumber,
        `Hello ${data.name}! ${guide.name} has invited you to create your Picture Book with Morrowotif. Register here: ${link}`
      );
    } catch (err) {
      console.error('Failed to send Referral link:', err);
      throw new Error('Failed to send WhatsApp message');
    }

    return { success: true };
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
}
