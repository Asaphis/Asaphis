# AsaPhis Backend — NestJS + Prisma + Redis/BullMQ

Modular, secure, auditable API for the AsaPhis ORG platform (user web + admin web).
Frontend never decides access — every protected route passes JWT guard → roles guard →
`AuthorizationService.evaluate()` (auth → identity → account → country → travel → device → risk → policy → audit log).

## 1. What was built (maps to master blueprint §§1–39)

| Area | Code |
|---|---|
| Auth + onboarding state machine | `src/modules/auth/*` (`REGISTERED→…→ACTIVE_MEMBER`) |
| RBAC + policy engine | `src/modules/authorization/*`, `Roles()` + `SUPER_ADMIN` bypass, `TRUSTED_MEMBER` inherits `MEMBER` |
| Phone (provider-independent) | `src/modules/phone/*` — `VerificationChannelProvider`, primary/fallback, hashed OTP, TTL/attempts/cooldown |
| Country config engine | `src/modules/countries/*` + `Country` table; admin-editable, never hard-coded |
| Identity/KYC abstraction | `src/modules/identity/*` — multi-provider interface, mock never auto-verifies, PII minimised |
| Devices / sessions | `src/modules/devices`, `src/modules/sessions` + admin terminate in `security` |
| Risk engine | `src/modules/risk/*` — LOW/MED/HIGH/CRITICAL, containment signals, never auto-ban |
| Geo/IP intel (signal only) | `src/modules/geo/*` |
| Travel grants (auto-expire) | `src/modules/travel/*` + `travel` BullMQ queue |
| Restrictions + history | `src/modules/restrictions/*` (10 restriction types) |
| Content + versions + landing | `src/modules/content/*` |
| Community + moderation | `src/modules/community/*` (`MEMBER_CHAT` flag off by default) |
| Notifications | `src/modules/notifications/*` + `notify` queue |
| Payments (country-aware) | `src/modules/payments/*` — config + global fallback, webhook-only confirmation |
| Support/appeals | `src/modules/support/*` |
| Analytics (≠ security logs) | `src/modules/analytics/*` |
| Audit (append-only) + admin audit | `src/modules/audit/*`, `AdminAuditLog` on every sensitive admin action |
| File security | `src/modules/files/*` — MIME/size/scan/signed-URL, identity docs private |
| Admin ops | `src/modules/admin/*` — dashboard, members, roles, providers |
| Settings + feature flags | `src/modules/settings/*` |
| Background jobs | `src/queues/*` — otp cleanup, travel expiry, notify, maintenance |
| Docs | Swagger at `/docs`, `docs/API.md` |

## 2. Prerequisites you must provide

| Need | Where | Notes |
|---|---|---|
| PostgreSQL (Neon for prod) | `DATABASE_URL`, `DIRECT_URL` | `?sslmode=require` on Neon; run `prisma migrate deploy` |
| Redis | `REDIS_URL` | BullMQ queues + throttling; local `docker-compose` includes it |
| JWT secrets (32+ chars) | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Generate: `openssl rand -base64 48` |
| Payment webhook secret | `PAYMENT_WEBHOOK_SECRET` | Must match provider dashboard |
| SMS vendor (pick one) | `PHONE_PRIMARY_PROVIDER` + `TWILIO_*` / `TERMII_*` / `AFRICASTALKING_*` | Leave `mock` for dev; mock logs OTP to console |
| KYC vendor (pick one) | `IDENTITY_PRIMARY_PROVIDER` + vendor keys | Leave `mock` for dev; mock queues `PENDING` for human review |
| S3-compatible storage | `S3_*` | Any S3 API (AWS, Cloudflare R2, MinIO) for media + private ID docs |
| SMTP (optional) | `SMTP_*` | Email notifications |
| Seed admin | `SEED_ADMIN_EMAIL/PASSWORD` | Change immediately after first login |

No frontend code ever receives provider secrets. Copy `.env.example` → `.env` and fill only what you use; everything boots with safe mock defaults.

## 3. Quick start

```powershell
cd backend
cp .env.example .env   # or: Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:4000/api/v1 — health: `/health`, docs: http://localhost:4000/docs
- User web expects `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- Admin web expects same + runs on :3001

Docker:

```powershell
docker compose up --build
```

## 4. Frontend alignment (verified against current UI)

User web (`web/frontend/src/lib/api/contracts.ts` + `mock-api.ts`) → backend routes:

| UI call | Backend |
|---|---|
| `login/logout` | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /me` |
| `detectCurrentCountry` | `GET /onboarding/detect-country`, `GET /geo/lookup` |
| `sendPhoneCode/verifyPhoneCode` | `POST /onboarding/phone/send|verify`, canonical `POST /phone/send|verify` |
| `getCountryConfig` | `GET /onboarding/country-config/:country`, `GET /countries/:code` |
| `submitIdentity/runSecurityCheck` | `POST /onboarding/identity/submit`, `POST /identity/submit`, `POST /onboarding/security-check` |
| `createContribution/getActivationStatus` | `POST /onboarding/contribution`, `POST /payments/create`, `GET /onboarding/activation` |
| `getMemberProfile/getEducation/getVideos/getDocuments/requestDocumentDownload` | `GET /me`, `GET /content/education`, `GET /content/published`, `GET /files/:id/url` |
| `getNotifications/submitCommunityContribution/createTravelRequest/createSupportRequest` | `GET /notifications`, `POST /community/submissions`, `POST /travel/requests`, `POST /support/requests` |

Admin web (`web/admin/src/lib/api/admin-contracts.ts`) → backend:

| Admin UI | Backend |
|---|---|
| dashboard/members/member detail | `GET /admin/dashboard`, `GET /admin/members`, `GET /admin/members/:id` |
| identity review | `GET /identity/cases`, `POST /identity/cases/:id/review` |
| content/landing/versions | `GET /content/admin`, `PATCH /content/:id/status`, `GET /content/:id/versions`, `POST /content/:id/restore/:v` |
| submissions/comments | `GET /community/admin/submissions`, `POST /community/admin/submissions/:id/review`, comments equivalents |
| travel | `GET /travel/admin/requests`, `POST /travel/admin/requests/:id/review` |
| payments | `GET /payments/admin/countries`, `PATCH /payments/admin/countries/:id` |
| countries | `GET /countries`, `PATCH /countries/:code` |
| notifications/community settings | `POST /notifications/admin`, `GET /settings/public`, `PUT /settings/:key` |
| security/sessions/devices/restrictions/audit | `GET /security/events|sessions|devices`, `POST /security/...`, `GET /restrictions`, `GET /audit`, `GET /audit/admin` |
| support/analytics/flags | `GET /support/admin/tickets`, `POST /support/admin/tickets/:id/reply`, `GET /analytics`, `GET /settings/flags` |

Auth: user + admin both send `Authorization: Bearer <accessToken>` or rely on `asaphis_at` httpOnly cookie. Admin login reuses `/auth/login`; role comes from JWT — UI role-switcher is dev-only and must not grant backend rights.

## 5. Security notes

- Helmet + CORS allowlist (user :3000, admin :3001) + global `ValidationPipe` (whitelist).
- `ThrottlerModule` default 120 req/min; tighten auth/phone routes in production (WAF + captcha).
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production (`COOKIE_SECURE=true`).
- OTPs stored as SHA-256 hash, 5 attempts, 5-min TTL, resend cooldown, hourly rate limit (enforce via Redis in prod).
- ID documents: private bucket, signed URLs, no raw docs to ordinary admins, `IdentityDocument` links via `FileAsset`.
- Audit: `AuditLog` (user/security) and `AdminAuditLog` (admin who/what/before/after/IP/reason) are append-only from app code.

## 6. Tests / verification

```powershell
npm test          # risk + authorization unit specs
npm run build     # nest build -> dist/
```

## 7. Next steps to go live

1. Provision Neon + Redis, set secrets, `prisma migrate deploy`, `prisma:seed`.
2. Choose SMS + KYC vendors, paste keys into backend `.env` only.
3. Configure S3 bucket + CORS, enable malware scan endpoint if available.
4. Set `COOKIE_SECURE=true`, real `USER_WEB_URL/ADMIN_WEB_URL`, put API behind HTTPS.
5. Replace frontend mock adapters (`mock-api.ts`, `admin-mock-api.ts`) with HTTP clients to these routes — contracts already match, so page code does not move.
