# AsaPhis User Web

This is the production user-facing AsaPhis web application. It is built with Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/Radix UI, and TanStack Query.

## Run locally

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — public home
- `/about` — AsaPhis purpose and principles
- `/message` — featured message, video, and transcript
- `/vision` — current work and future goals
- `/education` — public education preview with search and category filters
- `/support` — contribution and community support
- `/join` — membership verification and activation flow
- `/member` — authenticated member platform experience

## Application structure

```text
src/
├── app/                  # App Router route entry points
├── components/
│   ├── public/           # Shared public shell and public page compositions
│   ├── onboarding/       # Membership activation experience
│   ├── member/           # Authenticated member experience
│   ├── routes/           # Client runtime boundaries for interactive route flows
│   ├── shared/           # Cross-feature status and state UI
│   └── ui/               # shadcn/Radix primitives
└── lib/
    ├── api/              # Typed API contracts and local adapter
    ├── permissions/      # Authorization helpers
    ├── feature-flags.ts  # Feature switches
    ├── mock-data.ts      # UI-first local fixture data
    └── types.ts          # Shared domain types and formatters
```

The local API adapter and fixture data are intentionally kept beside the production feature code. Replace the adapter implementation with backend HTTP clients when the API is available; the route and feature components should not need to move.

## Validate

```powershell
npx tsc --noEmit
npm run lint
npm run build
```
