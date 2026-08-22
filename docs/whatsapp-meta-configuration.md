# WhatsApp and Meta Configuration

The website uses Click-to-Chat only after the customer explicitly chooses WhatsApp. `wa.me` does not authenticate the application, configure a webhook, or grant Cloud API permissions.

## Configuration matrix

| Variable | Required? | Used by | Where to get it | Purpose | Production notes |
|---|---|---|---|---|---|
| `DATABASE_URL` | Yes | API, Worker | PostgreSQL provider | Prisma database connection | Use the same production database in both services. |
| `REDIS_URL` | Yes | API, Worker | Redis provider | BullMQ queue connection | Use the same Redis instance in both services. |
| `DEMO_MODE` | Yes | API, Worker, integrations | Deployment configuration | Selects mock vs live providers | Set `false` in production. |
| `WHATSAPP_ACCESS_TOKEN` | Worker only when live | Worker/integrations | Meta Business Settings system user token | `Bearer` token for Cloud API sends | Secret; use a system-user token in production. |
| `WHATSAPP_PHONE_NUMBER_ID` | Worker only when live | Worker/integrations | Meta WhatsApp API Setup | Forms the `/<phone-number-id>/messages` Graph API path | This is not the visible business phone number. |
| `WHATSAPP_VERIFY_TOKEN` | API when webhook is enabled | API webhook verification | A random secret chosen by the operator and entered identically in Meta | Confirms the webhook GET challenge | Not an API access token. |
| `WHATSAPP_APP_SECRET` | API when webhook is enabled | API webhook authentication | Meta App Dashboard > App settings > Basic > App Secret | Verifies `X-Hub-Signature-256` on POST webhooks | Secret; never expose to frontend or logs. |
| `WHATSAPP_BUSINESS_NUMBER` | API for opt-in links | API | The business phone number connected to the WABA, in international format | Target of the customer `wa.me` link | Digits/country code are used; do not confuse with phone number ID. |
| `GOOGLE_PROJECT_ID` | Worker when live | Worker/integrations | Google Cloud project | Drive provider project | Required by the shared factory. |
| `GOOGLE_CLIENT_EMAIL` | Worker when live | Worker/integrations | Google service-account JSON | Drive authentication | Secret-adjacent identity value. |
| `GOOGLE_PRIVATE_KEY` | Worker when live | Worker/integrations | Google service-account JSON | Drive authentication | Store securely; preserve `\\n` if entered as one-line environment text. |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Optional Worker | Worker/integrations | Google Drive folder URL/ID | Parent folder for generated upload folders | Keep folders private or use a constrained upload design. |
| `NEXT_PUBLIC_API_URL` | Frontend | Web | API deployment URL | Browser API base URL | Public URL only; never place Meta tokens here. |
| `NEXT_PUBLIC_DEMO_MODE` | Optional frontend | Web | Frontend deployment configuration | Demo UI behavior | Never use this to hold credentials. |
| `NEXT_PUBLIC_DEMO_LOGIN_HINT` | Optional frontend | Web | Frontend deployment configuration | Demo-only login hint | Leave empty in production. |

There is no code reference to `WHATSAPP_API_VERSION`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, or `WHATSAPP_BUSINESS_PHONE_NUMBER`. The Graph API version is hard-coded in [meta-whatsapp.provider.ts](../packages/integrations/src/whatsapp/meta-whatsapp.provider.ts), currently `v19.0`.

The current committed API/Worker environment files are incomplete for live production: `apps/api/.env.prod` has no Meta or Google integration values, and `apps/worker/.env` has only `DATABASE_URL`, `REDIS_URL`, and `DEMO_MODE`. Add the variables in this table through the deployment secret manager; do not commit real tokens or keys.

## Token distinction

`WHATSAPP_VERIFY_TOKEN` is an arbitrary shared webhook-challenge secret. The API compares it during Meta’s GET verification request.

`WHATSAPP_ACCESS_TOKEN` is a Meta Graph API bearer token. The Worker sends it in the `Authorization: Bearer ...` header for Cloud API message requests. It is never used for webhook verification or inbound message parsing.

Inbound processing needs no access-token call: Meta posts the signed event to the API. Sending a WhatsApp reply requires the Worker access token and phone number ID.

## Meta dashboard procedure

1. Open Meta for Developers and create or select a WhatsApp-enabled app.
2. Connect the app to the correct WhatsApp Business Account and add/register the business phone number.
3. In WhatsApp > API Setup, copy the **Phone number ID** into Worker `WHATSAPP_PHONE_NUMBER_ID`. Record the visible international business number for API `WHATSAPP_BUSINESS_NUMBER`.
4. In Meta App Dashboard > Settings > Basic, reveal/copy the **App Secret** into API `WHATSAPP_APP_SECRET`.
5. Choose a strong random webhook secret and put it into API `WHATSAPP_VERIFY_TOKEN`. In the app’s WhatsApp configuration, set the callback URL to `https://<api-host>/api/webhooks/whatsapp` and enter the same verify token. Complete the GET challenge.
6. Subscribe the WABA to the `messages` webhook field. This delivers inbound messages and outbound delivery-status webhooks to the API.
7. In Business Settings, create a system user, assign it the app and WhatsApp Business Account assets, and generate a token with the permissions Meta exposes for the connected account, including `whatsapp_business_messaging` and, where required for account management, `whatsapp_business_management`.
8. Copy that system-user token into Worker `WHATSAPP_ACCESS_TOKEN`. Do not put it in API or frontend environment variables.
9. Set `DEMO_MODE=false`, deploy the API webhook variables to the API service, and deploy the Cloud API plus Google Drive variables to the Worker service.

## Messaging rules

When a user sends a message, Meta opens or refreshes a 24-hour customer-service window. Free-form text replies are permitted during that window. After it expires, a business-initiated update requires an approved template. A successful Graph API response means accepted by Meta, not delivered; delivery must be confirmed by status webhooks.

Meta account verification, business onboarding, phone-number registration, permissions, production limits, quality requirements, and any app review are account/use-case dependent. Click-to-Chat does not bypass them.

The database stores `lastInboundMessageAt` and `whatsappConversationOpenUntil`. These are updated only by a validated inbound webhook, never when a `wa.me` link is generated or opened.