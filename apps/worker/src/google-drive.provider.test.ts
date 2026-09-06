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
  permissions: { list: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

const config = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'http://localhost:8080/oauth2callback',
  refreshToken: 'refresh-token',
  userEmail: 'marrowmotifdrive@gmail.com',
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
        user: { emailAddress: config.userEmail, displayName: 'Marrowmotif Drive' },
        storageQuota: { limit: '100', usage: '10' },
      },
    });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.getAuthenticatedUser()).resolves.toEqual({
      emailAddress: config.userEmail,
      displayName: 'Marrowmotif Drive',
      storageQuota: { limit: '100', usage: '10' },
    });
  });

  it('returns an existing folder without creating a duplicate or permission request', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [{ id: 'existing-folder' }] } });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('A Picture Book')).resolves.toEqual({
      success: true,
      folderId: 'existing-folder',
      shareLink: 'https://drive.google.com/drive/folders/existing-folder',
    });
    expect(driveClient.files.create).not.toHaveBeenCalled();
    expect(driveClient.permissions.create).toHaveBeenCalledWith({
      fileId: 'existing-folder',
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: config.userEmail,
      },
    });
  });

  it('creates a folder with private access for the configured user', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [] } });
    driveClient.files.create.mockResolvedValue({ data: { id: 'new-folder' } });
    driveClient.permissions.create.mockResolvedValue({});
    const provider = new GoogleDriveProvider({ ...config, rootFolderId: 'root-folder' });

    await expect(provider.createClientFolder('A Picture Book')).resolves.toEqual({
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
    expect(driveClient.permissions.create).toHaveBeenCalledWith({
      fileId: 'new-folder',
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: config.userEmail,
      },
    });
  });

  it('removes public and other explicit permissions while preserving the target user', async () => {
    driveClient.files.list.mockResolvedValue({ data: { files: [] } });
    driveClient.files.create.mockResolvedValue({ data: { id: 'restricted-folder' } });
    driveClient.permissions.list.mockResolvedValue({
      data: {
        permissions: [
          { id: 'owner', type: 'user', emailAddress: 'owner@example.com', role: 'owner' },
          { id: 'target', type: 'user', emailAddress: config.userEmail, role: 'writer' },
          { id: 'anyone', type: 'anyone', role: 'writer' },
          { id: 'group', type: 'group', emailAddress: 'other@example.com', role: 'reader' },
        ],
      },
    });
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('Restricted Picture Book')).resolves.toMatchObject({
      success: true,
      folderId: 'restricted-folder',
    });
    expect(driveClient.permissions.delete).toHaveBeenCalledWith({
      fileId: 'restricted-folder',
      permissionId: 'anyone',
    });
    expect(driveClient.permissions.delete).toHaveBeenCalledWith({
      fileId: 'restricted-folder',
      permissionId: 'group',
    });
    expect(driveClient.permissions.delete).toHaveBeenCalledTimes(2);
    expect(driveClient.permissions.create).not.toHaveBeenCalled();
  });

  it('returns a safe failure result and does not log OAuth secrets', async () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    driveClient.files.list.mockRejectedValue(new Error(`invalid ${config.refreshToken} ${config.clientSecret}`));
    const provider = new GoogleDriveProvider(config);

    await expect(provider.createClientFolder('A Picture Book')).resolves.toEqual({
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