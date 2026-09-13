import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { execFile } from 'node:child_process';
import { URL } from 'node:url';
import { google } from 'googleapis';
import {
  GOOGLE_DRIVE_SCOPE,
  GoogleDriveProvider,
} from '@travel/integrations';

const requiredKeys = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REDIRECT_URI',
] as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Required environment variable ${key} is not set`);
  return value;
}

function openBrowser(url: string): void {
  if (process.platform === 'win32') {
    execFile('explorer.exe', [url]);
  } else if (process.platform === 'darwin') {
    execFile('open', [url]);
  } else {
    execFile('xdg-open', [url]);
  }
}

function sendHtml(response: ServerResponse, message: string): void {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<html><body><p>${message}</p><p>You can close this window.</p></body></html>`);
}

async function receiveAuthorizationCode(redirectUri: string, authorizationUrl: string): Promise<string> {
  const callback = new URL(redirectUri);
  if (callback.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(callback.hostname)) {
    throw new Error('GOOGLE_DRIVE_REDIRECT_URI must be a localhost HTTP callback for drive:auth');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      const requestUrl = new URL(request.url || '/', callback.origin);
      if (requestUrl.pathname !== callback.pathname) {
        response.writeHead(404).end();
        return;
      }

      const error = requestUrl.searchParams.get('error');
      const code = requestUrl.searchParams.get('code');
      if (error) {
        sendHtml(response, 'Google authorization was denied.');
        settled = true;
        server.close();
        reject(new Error(`Google authorization failed: ${error}`));
        return;
      }
      if (!code) {
        sendHtml(response, 'No authorization code was received.');
        return;
      }

      sendHtml(response, 'Google authorization completed.');
      settled = true;
      server.close();
      resolve(code);
    });

    server.on('error', reject);
    server.listen(Number(callback.port || 80), callback.hostname, () => {
      console.log(`Open this URL to authorize the configured Drive account:\n${authorizationUrl}`);
      try {
        openBrowser(authorizationUrl);
      } catch {
        console.log('The browser could not be opened automatically. Use the URL above.');
      }
    });

    server.on('close', () => {
      if (!settled) reject(new Error('OAuth callback server closed before authorization completed'));
    });
  });
}

async function main(): Promise<void> {
  for (const key of requiredKeys) requireEnv(key);

  const clientId = requireEnv('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_DRIVE_CLIENT_SECRET');
  const redirectUri = requireEnv('GOOGLE_DRIVE_REDIRECT_URI');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GOOGLE_DRIVE_SCOPE],
  });

  const code = await receiveAuthorizationCode(redirectUri, authorizationUrl);
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh token. Run drive:auth again and approve consent.');
  }

  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const about = await drive.about.get({ fields: 'user(displayName,emailAddress)' });
  const authenticatedEmail = about.data.user?.emailAddress;
  console.log(`Authenticated Google user: ${authenticatedEmail || 'unknown'}`);
  console.log(`Display name: ${about.data.user?.displayName || 'unknown'}`);
  console.log('\nStore this refresh token as GOOGLE_DRIVE_REFRESH_TOKEN in the Worker environment:');
  console.log(tokens.refresh_token);

  if (process.argv.includes('--create-test-folder')) {
    const provider = new GoogleDriveProvider({
      clientId,
      clientSecret,
      redirectUri,
      refreshToken: tokens.refresh_token,
      rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    });
    if (!authenticatedEmail) throw new Error('Google did not return the authenticated email');
    const result = await provider.createClientFolder(
      `Marrowmotif OAuth verification ${new Date().toISOString()}`,
      authenticatedEmail,
    );
    if (!result.success) throw new Error(result.error || 'Drive verification folder creation failed');
    console.log(`Verification folder ID: ${result.folderId}`);
    console.log(`Verification folder link: ${result.shareLink}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Drive OAuth setup failed');
  process.exitCode = 1;
});