import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('google-drive') private automationQueue: Queue, // Same queue used for worker
    private eventEmitter: EventEmitter2,
  ) {}

  async sendCustom(
    pictureBookId: string,
    messageContent: string,
    user: { id: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');
    return this.queueMessage(pictureBookId, messageContent, user);
  }

  private async queueMessage(
    pictureBookId: string,
    messageContent: string,
    user: { id: string; role: Role },
  ) {
    if (typeof messageContent !== 'string' || !messageContent.trim() || messageContent.length > 4096) {
      throw new ForbiddenException('Message must be a non-empty text message under 4096 characters');
    }
    const pictureBook = await this.prisma.pictureBook.findUnique({
      where: { id: pictureBookId },
      include: { user: true },
    });
    if (!pictureBook) throw new NotFoundException('PictureBook not found');
    if (!pictureBook.user.whatsappNumber) throw new ForbiddenException('Customer has not opted in to WhatsApp updates');
    if (pictureBook.whatsappStatus !== 'CONVERSATION_INITIATED' || !pictureBook.lastInboundMessageAt || !pictureBook.whatsappConversationOpenUntil || pictureBook.whatsappConversationOpenUntil <= new Date()) {
      throw new ForbiddenException('WhatsApp conversation window has expired. A free-form message cannot be sent right now.');
    }
    const jobId = `manual-wa-${pictureBookId}-${Date.now()}`;
    await this.automationQueue.add(
      'send-manual-whatsapp',
      { pictureBookId, messageContent },
      {
        jobId,
        attempts: 1, // Manual messages don't usually retry automatically to avoid spam
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    await this.prisma.activityLog.create({
      data: {
        pictureBookId,
        action: 'WHATSAPP_MANUAL_QUEUED',
        details: `Manual WhatsApp message queued: "${messageContent.substring(0, 30)}..."`,
      },
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'MANUAL_WHATSAPP_QUEUED',
      resourceType: 'PictureBook',
      resourceId: pictureBookId,
      status: 'SUCCESS',
      details: { messageSnippet: messageContent.substring(0, 50) },
    });

    return { message: 'Message queued successfully' };
  }
}
