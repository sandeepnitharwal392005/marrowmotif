import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PinoLogger } from 'nestjs-pino';

export interface AuditEventPayload {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'FAILURE';
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuditService.name);
  }

  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(payload: AuditEventPayload) {
    try {
      this.logger.info(
        `Audit Event received: ${payload.action} on ${payload.resourceType} [${payload.status}]`,
      );

      await this.prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: payload.action,
          resourceType: payload.resourceType,
          resourceId: payload.resourceId,
          status: payload.status,
          details: payload.details ? JSON.stringify(payload.details) : null,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
          requestId: payload.requestId,
        },
      });
    } catch (err: any) {
      // Catch error so the original request doesn't fail if audit DB write fails
      this.logger.error(
        { err, payload },
        'Failed to persist audit log asynchronously',
      );
    }
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
