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

    // Persist the outgoing message before handing it to BullMQ.  Previously the
    // worker created this row, leaving a race where an admin saw "queued" but
    // no WhatsApp log until the worker happened to start.  The row is also the
    // durable audit record if the worker is delayed or unavailable.
    const whatsappMessage = await this.prisma.whatsAppMessage.create({
      data: {
        pictureBookId,
        status: 'QUEUED',
        attempts: 0,
        direction: 'OUTBOUND',
        body: messageContent.trim(),
        senderNumber: pictureBook.user.whatsappNumber,
      },
    });
    const jobId = `manual-wa-${pictureBookId}-${Date.now()}`;
    try {
      await this.automationQueue.add(
        'send-manual-whatsapp',
        { pictureBookId, messageContent: messageContent.trim(), whatsAppMessageId: whatsappMessage.id },
        {
          jobId,
          attempts: 1, // Manual messages don't usually retry automatically to avoid spam
          removeOnComplete: false,
          removeOnFail: false,
        },
      );
    } catch (error: any) {
      // Do not leave an admin-facing record in QUEUED when Redis is unavailable.
      await this.prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'FAILED',
          errorMessage: `Could not queue message: ${error?.message || 'Unknown queue error'}`,
        },
      });
      throw error;
    }

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

    return { message: 'Message queued successfully', messageId: whatsappMessage.id };
  }
}
