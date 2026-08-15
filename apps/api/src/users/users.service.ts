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
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
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
        id: true, name: true, email: true, role: true, createdAt: true,
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
}
