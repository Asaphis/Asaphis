# AsaPhis

AsaPhis is organized as a production-oriented workspace with separate user web, admin web, and backend application boundaries.

## Workspace layout

```text
AsaPhis/
├── web/
│   ├── frontend/   # User-facing Next.js application
│   └── admin/      # Admin application boundary
└── backend/        # API and authorization service boundary
```

The UI-first implementation lives in `web/frontend`, the same application location intended for the production user experience. Its deterministic local data adapter can be replaced by HTTP clients later without moving the page or feature code.

## Run the user web application

```powershell
cd web/frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available public routes include `/`, `/about`, `/message`, `/vision`, `/education`, `/support`, `/join`, and `/member`.

## Production boundaries

- `web/frontend`: Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/Radix UI, TanStack Query, and local UI-first API adapters.
- `web/admin`: reserved for internal moderation, content, authorization, and operational workflows.
- `backend`: reserved for real authentication, authorization, content, verification, contribution, travel, support, and audit APIs.

The current user experience intentionally uses local fixtures and a deterministic API adapter so every route is browseable and interactive before backend integration.
