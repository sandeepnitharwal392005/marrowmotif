# Marrowmotif — Where Memory Meets Craft

Marrowmotif is a modern **Picture Book Platform** connecting customers with curated, crafted memories. It enables Customers to request bespoke picture books, securely upload their photos, and track the physical delivery of their handcrafted memories. 

Marrowmotif is **not** a travel booking platform. It focuses entirely on memory curation, physical book production, and communication.

---

## 🚀 Business Model & User Journey

The Marrowmotif platform enforces strict Role-Based Access Control (RBAC) across three primary actors:

1. **Customer**: The customer requesting the Picture Book.
2. **Guide**: A referral partner (e.g., a tour guide) who refers customers to Marrowmotif but has restricted access to their private data.
3. **Admin**: The business operator responsible for producing the books, managing communications, and driving the backend processes.

### Complete Customer Journey
1. **Referral (Optional):** A Guide refers a customer.
2. **Account Creation:** The Customer creates an account (or is registered via referral).
3. **Picture Book Creation:** The Customer creates one or multiple Picture Books (e.g., "My Safari Trip", "Wedding Memories").
4. **Drive Generation (Admin):** The Admin securely triggers the creation of a unique Google Drive upload folder dedicated specifically to that Picture Book.
5. **Photo Upload:** The customer receives the Drive link and uploads their photos.
6. **Production (Admin):** The Admin updates the production status of the Picture Book (e.g., `IN_PRODUCTION`, `COMPLETED`).
7. **Communication (Admin/Automated):** The Admin triggers automated WhatsApp notifications or sends custom manual messages using the Marrowmotif business credentials.
8. **Delivery:** The Customer views tracking/delivery information directly on their dashboard.

---

## 🛠 Architecture

Marrowmotif utilizes a heavily decoupled, asynchronous architecture to ensure the frontend and API remain fast while offloading heavy operations (like Google Drive API and WhatsApp API) to a background worker.

```text
                    ┌──────────────┐
                    │   Next.js    │ (Frontend)
                    └──────┬───────┘
                           │ HTTPS / JWT
                           ↓
                    ┌──────────────┐
                    │  NestJS API  │ (Backend)
                    └──────┬───────┘
                           │ 
                 ┌─────────┴─────────┐
                 ↓                   ↓
          ┌────────────┐      ┌────────────┐
          │ PostgreSQL │      │   Redis    │ (Queue Storage)
          └────────────┘      └─────┬──────┘
                                    │
                              ┌─────┴──────┐
                              │ BullMQ     │ (Background Worker)
                              │ Node.js    │
                              └────────────┘
                                    │
                       ┌────────────┴────────────┐
                       ↓                         ↓
                Google Drive API            WhatsApp API
```

### Key Technical Concepts
- **Strict Separation of Concerns:** A failed Google Drive creation or WhatsApp message *does not* alter the fundamental business status of the Picture Book. Technical logs and business logs are separate.
- **Audit Logging:** Every critical Admin operation (Login, Status Update, Manual Messages) is recorded in an asynchronous Audit Log.
- **Error Handling:** The API handles Token Refreshing silently. All `401`, `403`, `404`, and `500` errors are caught by structural React components rather than crashing the DOM.

---

## 📊 Current Implementation Status

### ✅ Implemented
- **Full Authentication Flow:** Registration, login, JWT rotation, and silent token refreshing via cookies/headers.
- **Role-Based Access Control (RBAC):** Backend-enforced guards prevent Customers from hitting Admin routes and Guides from viewing un-referred customers.
- **Picture Book Lifecycle:** Customers can create books and specify delivery addresses; Admins can view and update their status.
- **Asynchronous Worker:** BullMQ properly queues and executes Google Drive folder generation.
- **IT Incidents:** Customers can report technical issues, which Admins can view and update.
- **Products Management:** Admins can create and edit catalog products.
- **Settings:** Admin settings successfully persist to the database.
- **Customer Search:** Debounced asynchronous search enforces proper pagination and limits without database crashes.

### ⚠️ Known Issues / Partially Implemented
- **Real WhatsApp Credentials:** Currently defaults to `DEMO_MODE=true` using mock API providers for WhatsApp. Real Meta API credentials must be configured in production `.env`.
- **Worker Telemetry:** While BullMQ processes jobs, deep telemetry/monitoring dashboards for the worker (e.g., BullMQ Dashboard) are not natively exposed in the UI yet.

### ❌ Not Yet Implemented
- **Payment Processing:** No Stripe/checkout integration exists yet for paying for the Picture Books.
- **Direct Drive Upload UI:** Currently, users receive a standard Google Drive link. Embedded UI upload directly into Drive is not yet built.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL
- Redis

### 1. Environment Variables
Copy `.env.example` to `.env` in the root folder.
```bash
# Ensure you configure your database and Redis
DATABASE_URL="postgresql://user:pass@localhost:5432/travel_platform"
REDIS_URL="redis://localhost:6379"
```

### 2. Install & Database
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

*Note: The seed script will create an `admin@example.com` account. If you cannot log in, run the API E2E test to recreate the `bcrypt` hashed admin password.*

### 3. Start Infrastructure
Run these three processes concurrently:

**API (NestJS):**
```bash
npm run start:dev --workspace=apps/api
# http://localhost:4000
```

**Worker (BullMQ):**
```bash
npm run dev --workspace=apps/worker
```

**Frontend (Next.js):**
```bash
npm run dev --workspace=apps/web
# http://localhost:3000
```

---

## 🚀 Production Deployment Considerations

This monorepo is fully production-ready.
- **Frontend:** Deploy `apps/web` to Vercel for instantaneous Edge caching and optimized React rendering.
- **Backend & Worker:** Deploy `apps/api` and `apps/worker` to Railway or Render as long-running Node.js services. Connect them to managed PostgreSQL and Redis instances on the same private network.
- **Security:** Ensure `DEMO_MODE=false` and Google Drive OAuth credentials, the refresh token, and Meta API credentials are provided only as strictly secured server/worker environment variables. See [Google Drive OAuth setup](docs/google-drive-oauth.md).