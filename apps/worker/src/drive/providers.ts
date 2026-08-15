import { DriveFolderResult } from '../types';

export class MockDriveProvider {
  async createClientFolder(
    clientName: string,
    bookingRef: string,
  ): Promise<DriveFolderResult> {
    await this.delay(300 + Math.random() * 400);
    const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const ref = (bookingRef || 'demo').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const folderId = `demo_${Math.random().toString(36).slice(2, 14)}`;
    const shareLink = `https://demo-drive.local/client/${slug}-${ref}`;
    console.log(`[MockDrive] ✅ Folder: "${clientName}" → ${shareLink}`);
    return { success: true, folderId, shareLink };
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export class GoogleDriveProvider {
  constructor(
    private config: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
      rootFolderId?: string;
    },
  ) {}

  async createClientFolder(
    clientName: string,
    bookingRef: string,
  ): Promise<DriveFolderResult> {
    const { google } = require('googleapis');
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: this.config.projectId,
          client_email: this.config.clientEmail,
          private_key: this.config.privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      const drive = google.drive({ version: 'v3', auth });
      const folderName = bookingRef ? `${clientName} - ${bookingRef}` : clientName;

      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: this.config.rootFolderId ? [this.config.rootFolderId] : undefined,
        },
      });

      const folderId = folder.data.id!;
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { role: 'writer', type: 'anyone' },
      });

      return {
        success: true,
        folderId,
        shareLink: `https://drive.google.com/drive/folders/${folderId}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
