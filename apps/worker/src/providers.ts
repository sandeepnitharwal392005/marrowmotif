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
        apiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || 'v24.0',
      });
    },
    get drive() {
      return new GoogleDriveProvider({
        projectId: process.env.GOOGLE_PROJECT_ID || 'morrowotif',
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
