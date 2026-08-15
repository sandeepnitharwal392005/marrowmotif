# Production Authentication Deployment

The web application reads `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_MODE`, and
`NEXT_PUBLIC_DEMO_LOGIN_HINT` when it is built. Set them in the frontend
deployment environment, then create a new production build. Runtime changes do
not alter an already built Next.js bundle.

For the production frontend:

```text
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_DEMO_LOGIN_HINT=
```

The API must have a production database URL, a strong `JWT_SECRET`, and the
exact frontend origins in `CORS_ORIGIN` (comma-separated when more than one is
needed). Its deployment platform must provide `PORT`; the API also accepts the
legacy `API_PORT` locally.

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://app.example.com
DEMO_MODE=false
REDIS_URL=rediss://...
```

The worker must use the same `DATABASE_URL`, `REDIS_URL`, and `DEMO_MODE` as
the API. With `DEMO_MODE=false`, it also requires Meta WhatsApp and Google
Drive provider credentials and exits at startup when any required value is
missing.

Before releasing the API, generate the Prisma client and deploy the canonical
schema migration from `packages/database/prisma/schema.prisma`. Do not run the
seed script in production: it creates development demonstration accounts.

After deploying, verify the deployed frontend's built JavaScript resolves the
expected API URL and no longer contains a demo login hint, then run the
authentication smoke test against the public domain. Check API logs for a
successful Prisma connection and for any Prisma error code returned while
issuing a refresh token.
