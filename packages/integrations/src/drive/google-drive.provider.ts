import { google } from 'googleapis';
import { DriveFolderResult } from '@travel/types';
import { DriveProvider } from './drive.provider';

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  rootFolderId?: string;
}

export interface DriveUserDiagnostic {
  emailAddress: string | null;
  displayName: string | null;
  storageQuota?: {
    limit: string | null;
    usage: string | null;
  };
}

export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function createGoogleDriveOAuthClient(config: Pick<GoogleDriveConfig, 'clientId' | 'clientSecret' | 'redirectUri' | 'refreshToken'>) {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );

  oauth2Client.setCredentials({ refresh_token: config.refreshToken });
  return oauth2Client;
}

export class GoogleDriveProvider implements DriveProvider {
  private readonly drive;

  constructor(private readonly config: GoogleDriveConfig) {
    const auth = createGoogleDriveOAuthClient(config);

    this.drive = google.drive({ version: 'v3', auth });
  }

  async getAuthenticatedUser(): Promise<DriveUserDiagnostic> {
    try {
      const response = await this.drive.about.get({
        fields: 'user(displayName,emailAddress),storageQuota(limit,usage)',
      });

      return {
        emailAddress: response.data.user?.emailAddress || null,
        displayName: response.data.user?.displayName || null,
        storageQuota: {
          limit: response.data.storageQuota?.limit || null,
          usage: response.data.storageQuota?.usage || null,
        },
      };
    } catch (error: unknown) {
      throw new Error(`Google Drive authentication failed: ${sanitizeDriveError(error, this.config)}`);
    }
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

      const shareLink = `https://drive.google.com/drive/folders/${folderId}`;

      return { success: true, folderId, shareLink };
    } catch (error: unknown) {
      const message = sanitizeDriveError(error, this.config);
      console.error('[GoogleDrive] Failed to create folder:', message);
      return { success: false, error: message };
    }
  }

  private async findExistingFolder(folderName: string) {
    const parent = this.config.rootFolderId
      ? ` and '${this.config.rootFolderId}' in parents`
      : '';
    const escapedName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const response = await this.drive.files.list({
      q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parent}`,
      fields: 'files(id, name)',
    });

    return response.data.files?.[0] || null;
  }

}

function formatDriveError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Unknown Drive error';

  const candidate = error as {
    code?: number | string;
    response?: { data?: { error?: string; error_description?: string } };
    message?: string;
  };
  const apiError = candidate.response?.data?.error_description || candidate.response?.data?.error;
  const message = apiError || candidate.message || 'Unknown Drive error';
  return candidate.code ? `${message} (code ${candidate.code})` : message;
}

function sanitizeDriveError(error: unknown, config: GoogleDriveConfig): string {
  return [config.clientSecret, config.refreshToken, config.clientId]
    .filter(Boolean)
    .reduce((message, secret) => message.replaceAll(secret, '[redacted]'), formatDriveError(error));
}
