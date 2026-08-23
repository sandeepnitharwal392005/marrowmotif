import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('google-drive') private readonly queue: Queue,
  ) {}

  async listWhatsappEvents() {
    return this.prisma.whatsAppWebhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async handleWhatsapp(body: any) {
    if (body?.object !== 'whatsapp_business_account') return { status: 'ignored' };

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        for (const status of change.value?.statuses || []) {
          const mapped = ['SENT', 'DELIVERED', 'READ'].includes(String(status.status).toUpperCase())
            ? String(status.status).toUpperCase() : 'FAILED';
          await this.prisma.whatsAppMessage.updateMany({
            where: { providerMessageId: status.id },
            data: { status: mapped as any, errorMessage: mapped === 'FAILED' ? 'Message delivery failed' : null },
          });
        }

        for (const message of change.value?.messages || []) {
          const eventId = message.id;
          if (!eventId) continue;
          try {
            const senderNumber = String(message.from || '').replace(/[^0-9]/g, '');
            const bodyText = message.text?.body || '';
            await this.prisma.whatsAppWebhookEvent.create({
              data: { providerEventId: eventId, senderNumber, body: bodyText },
            });
            const user = await this.prisma.user.findFirst({
              where: { whatsappNumber: { in: [senderNumber, `+${senderNumber}`] } },
              include: { pictureBooks: { orderBy: { updatedAt: 'desc' }, take: 1 } },
            });
            const pictureBook = user?.pictureBooks[0];
            if (!pictureBook) {
              await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingStatus: 'UNMATCHED' } });
              continue;
            }
            if (message.type !== 'text' || !bodyText.trim()) {
              await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingStatus: 'INVALID' } });
              continue;
            }
            await this.prisma.whatsAppMessage.create({
              data: {
                pictureBookId: pictureBook.id,
                providerEventId: eventId,
                direction: 'INBOUND',
                senderNumber,
                body: bodyText,
                status: 'DELIVERED',
                attempts: 1,
              },
            });
            if (!pictureBook) continue;

            await this.prisma.pictureBook.update({
              where: { id: pictureBook.id },
              data: { whatsappStatus: 'CONVERSATION_INITIATED', whatsappMessageReceivedAt: new Date(), lastInboundMessageAt: new Date(), whatsappConversationOpenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            });
            await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { matched: true, matchedPictureBookId: pictureBook.id, processingStatus: 'MATCHED' } });
            const response = pictureBook.driveLink
              ? `Your photo upload folder for “${pictureBook.title}” is ready!\n\nPlease upload your photos here:\n${pictureBook.driveLink}\n\nOnce your photos are uploaded, we’ll use them to create your picture book.`
              : `Your picture book is still being prepared. We’ll send your photo upload link here as soon as it’s ready.\n\nYou can also check the Picture Book page on our website for the latest status.`;
            await this.queue.add('send-manual-whatsapp', { pictureBookId: pictureBook.id, messageContent: response, idempotencyKey: `wa-inbound-reply-${eventId}` }, { jobId: `wa-inbound-reply-${eventId}`, attempts: 3, removeOnComplete: false, removeOnFail: false });
          } catch (error: any) {
            if (error?.code === 'P2002') continue;
            console.error('[Webhook] WhatsApp event processing failed:', error?.message || 'unknown error');
          }
        }
      }
    }
    return { status: 'ok' };
  }

}