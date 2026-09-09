# AsaPhis Backend

This directory is the production boundary for the AsaPhis API and service layer.

Planned service areas include:

- Authentication and session management
- Role-based authorization and policy decisions
- Published education and message content
- Phone and identity verification orchestration
- Contributions and payment status
- Travel access and support requests
- Community moderation and audit events

The user web currently exposes typed contracts in `web/frontend/src/lib/api/contracts.ts` and a deterministic local adapter in `web/frontend/src/lib/api/mock-api.ts`. Replace that adapter with backend clients while keeping the feature boundaries stable.
