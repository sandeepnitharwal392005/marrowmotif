import { Controller, Post, Get, Query, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  /**
   * WhatsApp webhook verification (GET)
   */
  @Public()
  @Get('whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  /**
   * WhatsApp webhook events (POST)
   */
  @Public()
  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Req() req: Request) {
    const body = req.body;

    // Process delivery receipts, read receipts etc.
    if (body?.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const statuses = change.value?.statuses || [];
          for (const status of statuses) {
            console.log(`[Webhook] WhatsApp status: ${status.id} -> ${status.status}`);
            // TODO: Update WhatsAppMessage status in DB based on status.id
          }
        }
      }
    }

    return { status: 'ok' };
  }
}
