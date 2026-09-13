# Google Drive OAuth setup

Marrowmotif creates Picture Book upload folders asynchronously in the BullMQ Worker. The Worker authenticates as the configured Google user with OAuth 2.0 and a refresh token.

## Google Cloud setup

1. Select or create the Google Cloud project for Marrowmotif.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen. Add the operator Google account as a test user while the app is in testing mode.
4. Create an OAuth client ID for a Web application.
5. Add the exact value of `GOOGLE_DRIVE_REDIRECT_URI` as an authorized redirect URI. For local setup, the example value is `http://localhost:8080/oauth2callback`.

The provider uses the narrower `https://www.googleapis.com/auth/drive.file` scope. It creates folders owned by the authenticated account and grants the picture-book creator `reader` access to that specific folder. Sharing is idempotent, does not delete other permissions, and does not send Google notification emails. The optional parent folder must be accessible to the app, such as a folder created by this app or selected through a Drive picker.

Generated folders are owned by the authenticated Google account. Only the associated picture-book creator receives direct reader access; existing ACLs are not modified.

## Environment

Set these variables in the root `.env` for local setup and in the Worker deployment environment. Do not add them to the Next.js browser environment:

```text
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8080/oauth2callback
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
```

The old `GOOGLE_PROJECT_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, and `GOOGLE_APPLICATION_CREDENTIALS` variables are no longer used by the Drive provider.

## One-time authorization

Run this from the repository root after setting the client ID, client secret, and redirect URI:

```bash
npm run drive:auth
```

Authorize as the Google account that should own the folders. The command verifies the authenticated email and prints the refresh token once so it can be entered as `GOOGLE_DRIVE_REFRESH_TOKEN` in the Worker environment. It does not save the token or authorization code.

To create and verify a harmless test folder after authorization:

```bash
npm run drive:auth -- --create-test-folder
```

The command prints only the authenticated email, display name, folder ID, and folder link. Check the folder in that account's My Drive. Existing Picture Book folder IDs and URLs remain in the same `PictureBook.driveLink` field.

## Migration and rollback

1. Generate and test the refresh token locally.
2. Deploy the five OAuth variables and optional root folder ID to the Worker.
3. Process one test Picture Book and confirm its folder appears in the intended user's My Drive.
4. Keep the old service account in Google Cloud until production verification is complete; the application no longer depends on it.

To roll back, stop the Worker, restore the previous application revision and service-account environment variables, then restart the Worker. Do not delete existing Drive folders or database URLs during rollback.

Drive failures continue to set only `driveStatus` and `driveError`; the Picture Book business status and the BullMQ retry/idempotency flow are unchanged.