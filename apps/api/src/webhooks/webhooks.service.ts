import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async listWhatsappEvents() {
    return this.prisma.whatsAppWebhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async handleWhatsapp(body: any) {
    console.log('[Webhook] handleWhatsapp called');
    console.log('[Webhook] Full body:', JSON.stringify(body, null, 2).substring(0, 2000));
    if (body?.object !== 'whatsapp_business_account') {
      console.log('[Webhook] Ignoring - object is not whatsapp_business_account:', body?.object);
      return { status: 'ignored' };
    }

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
            // Normalize phone number comparison by stripping non-digits from stored numbers
            const users = await this.prisma.$queryRaw<Array<{ id: string }>>`
              SELECT id FROM "users" 
              WHERE "whatsappNumber" IS NOT NULL 
              AND regexp_replace("whatsappNumber", '[^0-9]', '', 'g') = ${senderNumber}
              LIMIT 1
            `;
            if (users.length === 0) {
              console.log(`[Webhook] No user found for number: ${senderNumber}`);
              await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingStatus: 'UNMATCHED' } });
              continue;
            }
            const user = await this.prisma.user.findUnique({
              where: { id: users[0].id },
              include: { pictureBooks: { include: { messages: true }, orderBy: { updatedAt: 'desc' } } },
            });
            const pictureBook: any = user?.pictureBooks[0];
            if (!pictureBook) {
              console.log(`[Webhook] User ${user?.id} has no PictureBook`);
              await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingStatus: 'NO_PICTURE_BOOK' } });
              // No auto-reply — admin handles manually
              continue;
            }
            console.log(`[Webhook] Matched sender ${senderNumber} to user ${user?.id}, pictureBook ${pictureBook.id}`);
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

            await this.prisma.pictureBook.update({
              where: { id: pictureBook.id },
              data: { whatsappStatus: 'CONVERSATION_INITIATED', whatsappMessageReceivedAt: new Date(), lastInboundMessageAt: new Date(), whatsappConversationOpenUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            });
            await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { matched: true, matchedPictureBookId: pictureBook.id, processingStatus: 'MATCHED' } });

            await this.prisma.whatsAppWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingStatus: 'ADMIN_ATTENTION' } });
            console.log(`[Webhook] Inbound WhatsApp message for ${pictureBook.id} flagged for admin attention; no automatic reply`);
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