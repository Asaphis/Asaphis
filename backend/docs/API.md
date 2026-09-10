# AsaPhis API v1 — endpoint reference

Base: `{API_URL}/api/v1` · Auth: `Bearer` or `asaphis_at` cookie · Docs: `/docs`.
All responses JSON. Admin routes require the listed role (SUPER_ADMIN bypasses all).

## Auth / Me / Onboarding

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/auth/register` | public | `{name,email,phone?,password,countryOfCitizenship?,termsAccepted,privacyAccepted}` |
| POST | `/auth/login` | public | `{email,password}` → `{token,memberId,userId,roles,sessionId}` + httpOnly cookies |
| POST | `/auth/refresh` | cookie | rotates access token |
| POST | `/auth/logout` | user | revokes refresh session |
| GET | `/auth/me`, `/me` | user | profile + stage + identity status |
| GET | `/onboarding/detect-country` | public | `{country, source}` |
| GET | `/onboarding/country-config/:country` | public | identity docs + contribution + phone channels |
| POST | `/onboarding/phone/send` | user | `{number,channel}` → `{challengeId,resendAfterSeconds}` |
| POST | `/onboarding/phone/verify` | user | `{challengeId,code}` → `{verified}` |
| POST | `/onboarding/identity/submit` | user | `{country,document,fileToken}` |
| POST | `/onboarding/security-check` | user | `{passed}` |
| POST | `/onboarding/contribution` | user | `{amount,currency,method}` |
| GET | `/onboarding/activation` | user | `{active,memberId,stage}` |
| POST | `/phone/send`, `/phone/verify` | user | canonical provider-fallback channel API |
| POST | `/identity/submit` | user | KYC-vendor submit |
| GET | `/identity/status` | user | own status + history |

## Member self-service

| Method | Path | Notes |
|---|---|---|
| GET/DELETE | `/me/devices`, `/me/devices/:id` | list / revoke (revokes sessions) |
| GET/DELETE | `/me/sessions`, `/me/sessions/:id` | list / terminate |
| GET | `/risk/mine` | own recent risk scores |
| GET | `/content/published`, `/content/education?category=&search=` | public/member content |
| POST/GET | `/community/submissions`, `/community/comments` | submit (flag-aware), comment |
| POST/GET | `/travel/requests` | create + own history |
| POST/GET | `/support/requests` | create + own tickets |
| GET | `/notifications?category=` | own inbox |
| GET | `/payments/config` | public enabled configs |
| POST | `/payments/create` | `{amount,currency,method,countryCode?}` → pending |
| POST | `/files/upload/:kind` | multipart `file`; kinds: community\|identity\|content\|document |
| GET | `/files/:id/url` | short-lived access URL |
| POST | `/analytics/events` | product telemetry `{name,userId?,props?}` |
| GET | `/geo/lookup` | public IP intel signal |
| POST | `/authorization/evaluate` | `{action,resource?}` → policy decision (debug) |
| GET | `/settings/public` | WhatsApp/Telegram links etc. |

## Admin

| Method | Path | Roles |
|---|---|---|
| GET | `/admin/dashboard` | moderator+ |
| GET | `/admin/members`, `/admin/members/:id` | moderator+ |
| POST | `/admin/members/:id/roles` | super/security |
| GET | `/admin/providers`, `POST /admin/providers/:id/toggle` | super/security |
| GET | `/identity/cases`, `POST /identity/cases/:id/review` | security/super |
| GET | `/content/admin`, `POST /content`, `PATCH /content/:id/status`, `GET /content/:id/versions`, `POST /content/:id/restore/:v` | content/super |
| GET/POST | `/community/admin/submissions`, `/community/admin/submissions/:id/review`, `/community/admin/comments`, `/community/admin/comments/:id/review` | moderator+ |
| GET/POST | `/travel/admin/requests`, `/travel/admin/requests/:id/review` | security/super |
| POST/GET | `/restrictions`, `/restrictions/:id/lift`, `/restrictions` | moderator+ |
| GET/PATCH | `/payments/admin/countries`, `/payments/admin/countries/:id` | finance/super |
| GET/PATCH | `/countries`, `/countries/:code` | security/super |
| POST/GET | `/notifications/admin`, `/notifications/admin/all` | content/super |
| GET/POST | `/security/events`, `/security/events/:id/status`, `/security/sessions`, `/security/sessions/:id/terminate`, `/security/devices`, `/security/devices/:id/revoke` | security/super |
| GET | `/audit`, `/audit/admin` | security/super |
| GET/POST | `/support/admin/tickets`, `/support/admin/tickets/:id/reply`, `/support/admin/tickets/:id/status` | moderator+ |
| GET | `/analytics` | finance/content/super |
| GET/PUT | `/settings/flags`, `/settings/flags/:key`, `/settings`, `/settings/:key` | super |
| POST | `/payments/webhook` | public (HMAC `PAYMENT_WEBHOOK_SECRET`) — only verified events activate membership |

Decisions: `ALLOW|DENY|REQUIRE_MFA|REQUIRE_VERIFICATION|LIMITED_ACCESS|MANUAL_REVIEW|TEMPORARY_RESTRICTION`.
