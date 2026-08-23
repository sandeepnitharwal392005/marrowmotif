import {
  Controller,
  Post,
  Get,
  Query,
  Req,
  Res,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('whatsapp/events')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listWhatsappEvents() {
    return this.webhooksService.listWhatsappEvents();
  }

  /**
   * Test endpoint to simulate inbound WhatsApp message (no signature required)
   */
  @Public()
  @Post('whatsapp/test')
  @HttpCode(HttpStatus.OK)
  testWebhook(@Body() body: any) {
    console.log('[Webhook Test] Simulating inbound message');
    return this.webhooksService.handleWhatsapp({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messages: [{
              id: `test-${Date.now()}`,
              from: body.from || '9199xxxxxxxx',
              type: 'text',
              text: { body: body.message || 'Picture book updates' }
            }]
          }
        }]
      }]
    });
  }
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
    console.log('[Webhook] Received POST request');
    console.log('[Webhook] Headers:', JSON.stringify(req.headers));
    const signature = req.header('x-hub-signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    console.log(`[Webhook] signature: ${signature ? 'present' : 'missing'}`);
    console.log(`[Webhook] appSecret: ${appSecret ? 'present' : 'missing'}`);
    console.log(`[Webhook] rawBody: ${rawBody ? 'present' : 'missing'}`);
    if (!signature || !appSecret || !rawBody) {
      console.log('[Webhook] Ignoring request - missing signature, appSecret, or rawBody');
      return { status: 'ignored' };
    }
    const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      console.log('[Webhook] Ignoring request - signature mismatch');
      return { status: 'ignored' };
    }
    console.log('[Webhook] Signature verified, processing...');
    return this.webhooksService.handleWhatsapp(req.body);
  }
}
