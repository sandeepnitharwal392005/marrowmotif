import axios from 'axios';
import { WhatsAppSendResult } from '@travel/types';
import { WhatsAppProvider } from './whatsapp.provider';

interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
}

/**
 * Meta (Facebook) WhatsApp Cloud API provider.
 * Requires a pre-approved template in Meta Business Manager.
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: MetaConfig) {
    this.baseUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
  }

  async sendTemplateMessage(
    to: string,
    clientName: string,
    driveLink: string,
  ): Promise<WhatsAppSendResult> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.normalizeNumber(to),
        type: 'template',
        template: {
          name: this.config.templateName,
          language: { code: this.config.templateLanguage },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: clientName },
                { type: 'text', text: driveLink },
              ],
            },
          ],
        },
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const messageId = response.data?.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (error: any) {
      const err = error as any;
      const message =
        err?.response?.data?.error?.message || err?.message || 'Unknown error';
      console.error('[MetaWhatsApp] Send failed:', message);
      return { success: false, error: message };
    }
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: this.normalizeNumber(to),
            type: 'text',
            text: {
              body: text,
            },
          }),
        },
      );

      const data: any = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data?.error?.message || 'Failed to send text message',
        };
      }

      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (error: any) {
      const err = error as any;
      return {
        success: false,
        error: err.message || 'Unknown error occurred',
      };
    }
  }

  private normalizeNumber(number: string): string {
    // Strip + prefix for Meta API — it expects numbers without +
    return number.startsWith('+') ? number.slice(1) : number;
  }
}
