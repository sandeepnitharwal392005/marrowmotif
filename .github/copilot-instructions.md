# Copilot workflow

Use this lightweight Superpowers workflow for every non-trivial change:

1. Clarify the requested behavior and acceptance criteria. Inspect the owning code path and a nearby test before editing.
2. State a brief implementation plan. Prefer the smallest change that fits existing patterns; avoid speculative abstractions.
3. For behavior changes, write or update a focused test first when practical. Make the test fail for the right reason, implement the minimum fix, then refactor only if useful.
4. After each edit, run the narrowest relevant check. Before finishing, run the broader applicable checks and report exact results. Never claim success without verification.
5. Review the diff for regressions, security issues, missing authorization, error handling, and accidental scope. Do not revert unrelated user changes.

Keep responses concise. Ask a question only when a decision is genuinely blocked; otherwise make a reasonable assumption and name it. Do not broaden the task or add dependencies without need.

## Repository facts

- npm workspaces monorepo; Node.js >=20 and npm >=10.
- `apps/web`: Next.js frontend. `apps/api`: NestJS API. `apps/worker`: BullMQ worker. `packages/database`: shared Prisma schema/client. `packages/integrations`: external providers. `packages/types`: shared types.
- PostgreSQL and Redis are required for integrated local flows. Secrets belong in environment files, never source.
- Root commands: `npm run build`, `npm run test`, `npm run lint`, `npm run type-check`, `npm run dev`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`.
- Targeted commands use npm workspaces, for example `npm run build --workspace=apps/web` or `npm run test --workspace=apps/api`.
- Read the nearest `AGENTS.md` and relevant package README before changing code. Preserve existing API contracts, RBAC, audit logging, and async provider boundaries.
