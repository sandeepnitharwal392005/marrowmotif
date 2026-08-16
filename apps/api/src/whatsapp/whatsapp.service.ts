import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    @InjectQueue('google-drive') private automationQueue: Queue, // Same queue used for worker
    private eventEmitter: EventEmitter2,
  ) {}

  async sendDefault(pictureBookId: string, user: { id: string; role: Role }) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Access denied');

    const pictureBook = await this.prisma.pictureBook.findUnique({
      where: { id: pictureBookId },
      include: { user: true },
    });

    if (!pictureBook) throw new NotFoundException('PictureBook not found');

    const settings = await this.settingsService.getSettings();
    let template = settings.defaultWhatsappTemplate;

    // Interpolate variables
    template = template.replace('{{customer_name}}', pictureBook.user.name);
    template = template.replace('{{picture_book_name}}', pictureBook.title);
    template = template.replace('{{status}}', pictureBook.status);
    template = template.replace(
      '{{link}}',
      pictureBook.driveLink || 'Not generated yet',
    );

    return this.queueMessage(pictureBookId, template, user);
  }

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
