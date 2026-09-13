import { google } from 'googleapis';
import {
  createGoogleDriveOAuthClient,
  GoogleDriveProvider,
} from '@travel/integrations';
import { createProviders } from './providers';

jest.mock('googleapis', () => ({
  google: {
    auth: { OAuth2: jest.fn() },
    drive: jest.fn(),
  },
}));

const oauthClient = { setCredentials: jest.fn() };
const driveClient = {
  about: { get: jest.fn() },
  files: { list: jest.fn(), create: jest.fn() },
  permissions: { list: jest.fn(), create: jest.fn() },
};

const config = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'http://localhost:8080/oauth2callback',
  refreshToken: 'refresh-token',
};

beforeEach(() => {
  jest.clearAllMocks();
  driveClient.permissions.list.mockResolvedValue({ data: { permissions: [] } });
  (google.auth.OAuth2 as jest.Mock).mockImplementation(() => oauthClient);
  (google.drive as jest.Mock).mockReturnValue(driveClient);
});

describe('GoogleDriveProvider', () => {
  it('creates an OAuth2 client with offline credentials', () => {
    const client = createGoogleDriveOAuthClient(config);

    expect(client).toBe(oauthClient);
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
    expect(oauthClient.setCredentials).toHaveBeenCalledWith({ refresh_token: config.refreshToken });
  });

  it('requires each OAuth environment variable when the real Drive provider is requested', () => {
    const original = { ...process.env };
    process.env.DEMO_MODE = 'false';
    process.env.WHATSAPP_ACCESS_TOKEN = 'whatsapp-token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id';

    for (const key of [
      'GOOGLE_DRIVE_CLIENT_ID',
      'GOOGLE_DRIVE_CLIENT_SECRET',
      'GOOGLE_DRIVE_REDIRECT_URI',
      'GOOGLE_DRIVE_REFRESH_TOKEN',
    ]) {
      delete process.env[key];
      expect(() => createProviders().drive).toThrow(`Required environment variable ${key} is not set`);
      process.env[key] = `configured-${key}`;
    }

    process.env = original;
  });

  it('reports the authenticated Drive user without exposing credentials', async () => {
    driveClient.about.get.mockResolvedValue({
      data: {
        user: { emailAddress: 'marrowmotifdrive@gmail.com', displayName: 'Marrowmotif Drive' },
        storageQuota: { limit: '100', usage: '10' },
      },
    });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.getAuthenticatedUser()).resolves.toEqual({
      emailAddress: 'marrowmotifdrive@gmail.com',
      displayName: 'Marrowmotif Drive',
      storageQuota: { limit: '100', usage: '10' },
    });
  });

  it('returns an existing folder and grants the creator reader access', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [{ id: 'existing-folder' }] } });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('A Picture Book', 'Customer@Example.com')).resolves.toEqual({
      success: true,
      folderId: 'existing-folder',
      shareLink: 'https://drive.google.com/drive/folders/existing-folder',
    });
    expect(driveClient.files.create).not.toHaveBeenCalled();
    expect(driveClient.permissions.create).toHaveBeenCalledWith({
      fileId: 'existing-folder',
      sendNotificationEmail: false,
      requestBody: {
        type: 'user',
        role: 'reader',
        emailAddress: 'customer@example.com',
      },
    });
  });

  it('creates a folder owned by the authenticated account', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [] } });
    driveClient.files.create.mockResolvedValue({ data: { id: 'new-folder' } });
    const provider = new GoogleDriveProvider({ ...config, rootFolderId: 'root-folder' });

    await expect(provider.createClientFolder('A Picture Book', 'customer@example.com')).resolves.toEqual({
      success: true,
      folderId: 'new-folder',
      shareLink: 'https://drive.google.com/drive/folders/new-folder',
    });
    expect(driveClient.files.create).toHaveBeenCalledWith({
      requestBody: {
        name: 'A Picture Book',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root-folder'],
      },
    });
    expect(google.drive).toHaveBeenCalledTimes(1);
    expect(driveClient.permissions.create).toHaveBeenCalledWith({
      fileId: 'new-folder',
      sendNotificationEmail: false,
      requestBody: {
        type: 'user',
        role: 'reader',
        emailAddress: 'customer@example.com',
      },
    });
  });

  it('does not create a duplicate permission when a retry finds existing access', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [{ id: 'existing-folder' }] } });
    driveClient.permissions.list.mockResolvedValue({
      data: { permissions: [{ type: 'user', emailAddress: 'customer@example.com', role: 'reader' }] },
    });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('A Picture Book', 'CUSTOMER@example.com')).resolves.toMatchObject({
      success: true,
      folderId: 'existing-folder',
    });
    expect(driveClient.permissions.create).not.toHaveBeenCalled();
  });

  it('returns a safe failure result and does not log OAuth secrets', async () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    driveClient.files.list.mockRejectedValue(new Error(`invalid ${config.refreshToken} ${config.clientSecret}`));
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('A Picture Book', 'customer@example.com')).resolves.toEqual({
      success: false,
      error: 'invalid [redacted] [redacted]',
    });
    expect(logSpy).toHaveBeenCalledWith(
      '[GoogleDrive] Failed to create folder:',
      'invalid [redacted] [redacted]',
    );
    logSpy.mockRestore();
  });
});