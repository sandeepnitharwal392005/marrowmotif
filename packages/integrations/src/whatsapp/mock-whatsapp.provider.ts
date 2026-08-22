import { WhatsAppSendResult } from '@travel/types';
import { WhatsAppProvider } from './whatsapp.provider';

/**
 * Mock WhatsApp provider for DEMO_MODE.
 * Simulates realistic send behavior with occasional configurable failures.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  private readonly failureRate: number;

  constructor(failureRate = 0) {
    this.failureRate = failureRate;
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    console.log(`\n[MOCK WHATSAPP] Sending TEXT to ${to}:`);
    console.log(text);
    console.log('----------------------------------------\n');

    return {
      success: true,
      messageId: `mock-txt-${Date.now()}`,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
