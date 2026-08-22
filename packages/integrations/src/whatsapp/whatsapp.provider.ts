import { WhatsAppSendResult } from '@travel/types';

export interface WhatsAppProvider {
  sendTextMessage(
    to: string,
    text: string,
  ): Promise<WhatsAppSendResult>;
}
