import { google } from 'googleapis';
import { DriveFolderResult } from '@travel/types';
import { DriveProvider } from './drive.provider';

interface GoogleDriveConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  rootFolderId?: string;
}

/**
 * Google Drive provider using service account credentials.
 * Creates per-client folders under a configurable root folder.
 */
export class GoogleDriveProvider implements DriveProvider {
  private readonly drive;

  constructor(private readonly config: GoogleDriveConfig) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: config.projectId,
        client_email: config.clientEmail,
        private_key: config.privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async createClientFolder(
    folderName: string,
  ): Promise<DriveFolderResult> {
    try {

      // Check for existing folder (idempotency)
      const existing = await this.findExistingFolder(folderName);
      if (existing) {
        console.log(`[GoogleDrive] Folder already exists: ${folderName}`);
        return {
          success: true,
          folderId: existing.id!,
          shareLink: `https://drive.google.com/drive/folders/${existing.id}`,
        };
      }

      // Create folder
      const folder = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: this.config.rootFolderId ? [this.config.rootFolderId] : undefined,
        },
      });

      const folderId = folder.data.id!;

      // Set sharing to anyone with link can upload
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'writer',
          type: 'anyone',
        },
      });

      const shareLink = `https://drive.google.com/drive/folders/${folderId}`;

      return { success: true, folderId, shareLink };
    } catch (error: any) {
      const message = error?.message || 'Unknown Drive error';
      console.error('[GoogleDrive] Failed to create folder:', message);
      return { success: false, error: message };
    }
  }

  private async findExistingFolder(folderName: string) {
    const parent = this.config.rootFolderId
      ? ` and '${this.config.rootFolderId}' in parents`
      : '';

    const response = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parent}`,
      fields: 'files(id, name)',
    });

    return response.data.files?.[0] || null;
  }
}
