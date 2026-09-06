import { WhatsAppProvider } from './whatsapp/whatsapp.provider';
import { MockWhatsAppProvider } from './whatsapp/mock-whatsapp.provider';
import { MetaWhatsAppProvider } from './whatsapp/meta-whatsapp.provider';
import { DriveProvider } from './drive/drive.provider';
import { MockDriveProvider } from './drive/mock-drive.provider';
import { GoogleDriveProvider } from './drive/google-drive.provider';

export interface Providers {
  whatsApp: WhatsAppProvider;
  drive: DriveProvider;
  isDemoMode: boolean;
}

/**
 * Factory that creates providers based on DEMO_MODE env variable.
 * When DEMO_MODE=true, uses mock providers.
 * When real credentials are provided, uses production providers.
 */
export function createProviders(): Providers {
  const isDemoMode =
    process.env.DEMO_MODE === 'true' ||
    process.env.DEMO_MODE === '1';

  if (isDemoMode) {
    console.log('[Providers] 🎭 Running in DEMO MODE — using mock providers');
    return {
      whatsApp: new MockWhatsAppProvider(),
      drive: new MockDriveProvider(),
      isDemoMode: true,
    };
  }

  console.log('[Providers] 🚀 Running in PRODUCTION MODE — using real providers');

  const whatsApp = new MetaWhatsAppProvider({
    accessToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
  });

  const drive = new GoogleDriveProvider({
    clientId: requireEnv('GOOGLE_DRIVE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_DRIVE_CLIENT_SECRET'),
    redirectUri: requireEnv('GOOGLE_DRIVE_REDIRECT_URI'),
    refreshToken: requireEnv('GOOGLE_DRIVE_REFRESH_TOKEN'),
    userEmail: requireEnv('GOOGLE_DRIVE_USER_EMAIL'),
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
  });

  return { whatsApp, drive, isDemoMode: false };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
