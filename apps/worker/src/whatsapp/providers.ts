import { WhatsAppSendResult } from '../types';

export class MockWhatsAppProvider {
  async sendTemplateMessage(
    to: string,
    clientName: string,
    driveLink: string,
  ): Promise<WhatsAppSendResult> {
    await this.delay(200 + Math.random() * 300);
    const messageId = `mock_wamid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[MockWhatsApp] ✅ Sent to ${to} (${clientName}): ${messageId}`);
    console.log(`[MockWhatsApp]    Link: ${driveLink}`);
    return { success: true, messageId };
  }

  async sendMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    await this.delay(200 + Math.random() * 300);
    const messageId = `mock_wamid_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[MockWhatsApp] ✅ Sent manual message to ${to}: ${messageId}`);
    console.log(`[MockWhatsApp]    Text: ${text.slice(0, 50)}...`);
    return { success: true, messageId };
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export class MetaWhatsAppProvider {
  constructor(
    private config: {
      accessToken: string;
      phoneNumberId: string;
      templateName: string;
      templateLanguage: string;
    },
  ) {}

  async sendTemplateMessage(
    to: string,
    clientName: string,
    driveLink: string,
  ): Promise<WhatsAppSendResult> {
    const axios = require('axios');
    try {
      const url = `https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`;
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: to.startsWith('+') ? to.slice(1) : to,
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
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return { success: true, messageId: response.data?.messages?.[0]?.id };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.error?.message || err.message };
    }
  }

  async sendMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    const axios = require('axios');
    try {
      const url = `https://graph.facebook.com/v19.0/${this.config.phoneNumberId}/messages`;
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: to.startsWith('+') ? to.slice(1) : to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return { success: true, messageId: response.data?.messages?.[0]?.id };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.error?.message || err.message };
    }
  }
}
