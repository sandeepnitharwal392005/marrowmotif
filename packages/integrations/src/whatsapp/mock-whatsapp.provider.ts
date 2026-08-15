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

  async sendTemplateMessage(
    to: string,
    clientName: string,
    driveLink: string,
  ): Promise<WhatsAppSendResult> {
    // Simulate network latency
    await this.delay(200 + Math.random() * 300);

    // Simulate occasional failures for testing retry logic
    if (Math.random() < this.failureRate) {
      return {
        success: false,
        error: 'Mock provider: simulated transient failure',
      };
    }

    const messageId = `mock_wamid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log(
      `[MockWhatsApp] ✅ Sent to ${to} (${clientName}): ${messageId}`,
    );
    console.log(`[MockWhatsApp]    Drive link: ${driveLink}`);

    return {
      success: true,
      messageId,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
