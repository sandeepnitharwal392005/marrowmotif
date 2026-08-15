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
    process.env.DEMO_MODE === '1' ||
    !process.env.DEMO_MODE;

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
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'welcome_client',
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
  });

  const drive = new GoogleDriveProvider({
    projectId: requireEnv('GOOGLE_PROJECT_ID'),
    clientEmail: requireEnv('GOOGLE_CLIENT_EMAIL'),
    privateKey: requireEnv('GOOGLE_PRIVATE_KEY'),
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
