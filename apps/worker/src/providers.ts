import { 
  MockWhatsAppProvider, 
  MetaWhatsAppProvider, 
  MockDriveProvider, 
  GoogleDriveProvider 
} from '@travel/integrations';

export function createProviders() {
  const isDemoMode =
    process.env.DEMO_MODE === 'true' ||
    process.env.DEMO_MODE === '1';

  if (isDemoMode) {
    console.log('[Providers] 🎭 DEMO MODE — using mock providers');
    return {
      whatsApp: new MockWhatsAppProvider(),
      drive: new MockDriveProvider(),
      isDemoMode: true,
    };
  }

  console.log('[Providers] 🚀 PRODUCTION MODE — using real providers');
  return {
    get whatsApp() {
      return new MetaWhatsAppProvider({
        accessToken: requireEnv('WHATSAPP_ACCESS_TOKEN'),
        phoneNumberId: requireEnv('WHATSAPP_PHONE_NUMBER_ID'),
      });
    },
    get drive() {
      return new GoogleDriveProvider({
        clientId: requireEnv('GOOGLE_DRIVE_CLIENT_ID'),
        clientSecret: requireEnv('GOOGLE_DRIVE_CLIENT_SECRET'),
        redirectUri: requireEnv('GOOGLE_DRIVE_REDIRECT_URI'),
        refreshToken: requireEnv('GOOGLE_DRIVE_REFRESH_TOKEN'),
        userEmail: requireEnv('GOOGLE_DRIVE_USER_EMAIL'),
        rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      });
    },
    isDemoMode: false,
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Required environment variable ${key} is not set`);
  return value;
}
