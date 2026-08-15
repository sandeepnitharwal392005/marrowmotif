import { WhatsAppSendResult } from '@travel/types';

export interface WhatsAppProvider {
  sendTemplateMessage(
    to: string,
    clientName: string,
    driveLink: string,
  ): Promise<WhatsAppSendResult>;
  sendTextMessage(
    to: string,
    text: string,
  ): Promise<WhatsAppSendResult>;
}
