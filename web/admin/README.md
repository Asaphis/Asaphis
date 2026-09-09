# AsaPhis Admin Web

Internal control center for AsaPhis ORG: dashboard, members, identity &
verification, content + landing builder, moderation, community, payments,
regions & countries, notifications, security center, support, analytics,
and settings.

## Run the admin application

```powershell
cd web/admin
npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). You land on the admin
login — sign in with any work email + 8-character password and pick an
acting role (Super, Security, Content, Moderator, Finance). Navigation is
gated by role with least privilege.

## Production boundaries

- Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/Radix UI,
  TanStack Query, and local admin-first API adapters.
- Typed contracts live in `src/lib/api/admin-contracts.ts`, implemented by
  the realistic in-memory adapter in `src/lib/api/admin-mock-api.ts` with
  seed data in `src/lib/admin-mock-data.ts`.
- Every mutating call writes to the audit log, mirroring the production
  requirement that every admin action is logged.
- Replace `createAdminApi` with HTTP clients later without touching page
  or component code. Secrets are referenced, never displayed.
