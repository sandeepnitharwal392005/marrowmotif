import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateIncidentDto, user: { id: string; role: Role }) {
    if (user.role !== Role.END_USER) {
      throw new ForbiddenException(
        'This endpoint is only available to customers',
      );
    }

    if (dto.pictureBookId) {
      const pictureBook = await this.prisma.pictureBook.findFirst({ where: { id: dto.pictureBookId, userId: user.id }, select: { id: true } });
      if (!pictureBook) throw new NotFoundException('Picture Book not found');
    }

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        userId: user.id,
        pictureBookId: dto.pictureBookId,
        priority: dto.priority || 'MEDIUM',
      },
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'INCIDENT_CREATED',
      resourceType: 'Incident',
      resourceId: incident.id,
      status: 'SUCCESS',
    });

    return incident;
  }

  async findAll(pagination: PaginationDto, user: { id: string; role: Role }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {};

    if (user.role === Role.END_USER) where.userId = user.id;
    if (user.role === Role.GUIDE) throw new ForbiddenException('Guides do not have access to incidents');

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          assignedTo: { select: { name: true } },
          pictureBook: { select: { title: true } },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        pictureBook: { select: { id: true, title: true, status: true } },
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    if (user.role !== Role.ADMIN && incident.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return incident;
  }

  async update(
    id: string,
    dto: UpdateIncidentDto,
    user: { id: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update incidents');
    }

    const incident = await this.prisma.incident.update({
      where: { id },
      data: dto,
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'INCIDENT_UPDATED',
      resourceType: 'Incident',
      resourceId: incident.id,
      status: 'SUCCESS',
      details: dto,
    });

    return incident;
  }
}
