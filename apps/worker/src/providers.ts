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
        templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'welcome_client',
        templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
      });
    },
    get drive() {
      return new GoogleDriveProvider({
        projectId: requireEnv('GOOGLE_PROJECT_ID'),
        clientEmail: requireEnv('GOOGLE_CLIENT_EMAIL'),
        privateKey: requireEnv('GOOGLE_PRIVATE_KEY'),
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
