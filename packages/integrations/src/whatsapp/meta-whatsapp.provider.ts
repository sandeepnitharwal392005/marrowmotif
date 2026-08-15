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
      const message =
        error?.response?.data?.error?.message || error?.message || 'Unknown error';
      console.error('[MetaWhatsApp] Send failed:', message);
      return { success: false, error: message };
    }
  }

  private normalizeNumber(number: string): string {
    // Strip + prefix for Meta API — it expects numbers without +
    return number.startsWith('+') ? number.slice(1) : number;
  }
}
