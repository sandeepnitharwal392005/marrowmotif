# Railway Deployment Guide (Monorepo)

Currently, the Marrowmotif project is a monorepo containing multiple applications (API, Web, Worker). By default, Railway's auto-detect will usually only run the first application it finds (like the API) if you deploy the root repository as a single service. 

To ensure the **Drive Generation & WhatsApp Worker** runs properly and picks up jobs from the queue, you must create a separate service in Railway.

## Step-by-Step Configuration

1. **Open your Railway Project Dashboard**
2. Click **+ New** -> **GitHub Repo**
3. Select this repository (`travel-platform` or whatever it's named in GitHub).
4. Once the new service is created, rename it to **Worker** (or something distinguishable from the API).
5. Go to the **Settings** tab of this new Worker service.
6. Under **Build**:
   - Ensure the Builder is set to **Nixpacks** (default).
7. Under **Deploy**:
   - Set the **Custom Start Command** to: 
     ```bash
     npm run start --workspace=apps/worker
     ```
8. Under **Variables**:
  - You must also provide the Worker-only Drive OAuth configuration here:
     - `GOOGLE_DRIVE_CLIENT_ID`
     - `GOOGLE_DRIVE_CLIENT_SECRET`
     - `GOOGLE_DRIVE_REDIRECT_URI`
     - `GOOGLE_DRIVE_REFRESH_TOKEN`
     - `GOOGLE_DRIVE_USER_EMAIL` (informational only; it is not used to authenticate)
     - `GOOGLE_DRIVE_ROOT_FOLDER_ID` (optional)
    - `WHATSAPP_ACCESS_TOKEN` (system-user Cloud API token)
    - `WHATSAPP_PHONE_NUMBER_ID`

  The Drive refresh token must be generated once with `npm run drive:auth` and entered directly into Railway. Never commit it or place it in the Next.js environment.
     - `GOOGLE_DRIVE_ROOT_FOLDER_ID`
     - `WHATSAPP_ACCESS_TOKEN`
     - `WHATSAPP_PHONE_NUMBER_ID`
    - `WHATSAPP_ACCESS_TOKEN` (system-user Cloud API token)
    - `WHATSAPP_PHONE_NUMBER_ID`

  The API and Worker start commands use the repository-pinned Prisma CLI (`prisma migrate deploy`). Do not replace this with an unpinned global or `npx` Prisma command.

  The API service needs `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, and `WHATSAPP_BUSINESS_NUMBER` for webhook verification, signature validation, and Click-to-Chat links. It does not need the Worker’s Cloud API access token. The application sends only free-form WhatsApp text inside the user’s 24-hour customer-service window; it does not use OTPs or templates.

By running the worker as an isolated service, it will securely process `google-drive` jobs independently from your API, and will not crash your API if an automation fails.
