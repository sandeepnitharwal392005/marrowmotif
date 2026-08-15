import { MockWhatsAppProvider, MetaWhatsAppProvider } from './whatsapp/providers';
import { MockDriveProvider, GoogleDriveProvider } from './drive/providers';

export function createProviders() {
  const isDemoMode =
    process.env.DEMO_MODE === 'true' ||
    process.env.DEMO_MODE === '1' ||
    !process.env.DEMO_MODE;

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
    whatsApp: new MetaWhatsAppProvider({
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'welcome_client',
      templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US',
    }),
    drive: new GoogleDriveProvider({
      projectId: process.env.GOOGLE_PROJECT_ID!,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
      privateKey: process.env.GOOGLE_PRIVATE_KEY!,
      rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    }),
    isDemoMode: false,
  };
}
