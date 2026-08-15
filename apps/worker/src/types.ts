export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DriveFolderResult {
  success: boolean;
  folderId?: string;
  shareLink?: string;
  error?: string;
}
