import { WhatsAppSendResult } from '@travel/types';
import { WhatsAppProvider } from './whatsapp.provider';

interface MetaConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
}

/**
 * Meta (Facebook) WhatsApp Cloud API provider.
 * Sends free-form text through the Cloud API.
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
  private readonly baseUrl: string;

  constructor(private readonly config: MetaConfig) {
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion || 'v24.0'}/${config.phoneNumberId}/messages`;
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    try {
      const response = await fetch(
        this.baseUrl,
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
        const providerError = data?.error;
        const detail = [providerError?.code, providerError?.type, providerError?.message]
          .filter(Boolean)
          .join(': ');
        return {
          success: false,
          error: detail || 'Failed to send text message',
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
