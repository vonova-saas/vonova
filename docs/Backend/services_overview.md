# Backend Services Overview

This document maps backend service responsibilities in `services/` and links to each service-level README.

## Architecture at a Glance

Client requests enter through the API Gateway, then flow through NATS to internal services.

`Frontend -> API Gateway -> NATS -> Internal Services (App, LMS, Admin) -> MongoDB/Redis/S3/AI providers`

## Service Map

### API Gateway (`services/api-gateway`)

- Public HTTP entrypoint for backend APIs.
- Routes requests to internal microservices over NATS.
- Centralized security layer (validation, CORS, Helmet/CSP, rate limiting, optional CSRF).

Documentation: `services/api-gateway/README.md`
Deep dive: `docs/Backend/services/api-gateway.md`

### App Service (`services/app`)

- Core authentication and account domain logic.
- JWT access + refresh token flow with rotation and blacklist.
- User/account-related domain modules and messaging handlers.

Documentation: `services/app/README.md`
Deep dive: `docs/Backend/services/app.md`

### LMS Service (`services/lms`)

- LMS domain (courses, lessons, quizzes, assignments, progress).
- LMS-AI orchestration flows (roadmap generation, PDF summary/chat).
- SSRF-protected outbound calls to AI services.

Documentation: `services/lms/README.md`
Deep dive: `docs/Backend/services/lms.md`

### Admin Service (`services/admin`)

- Admin-only user management and statistics endpoints.
- Protected admin routes with authentication + authorization chain.
- Secure service-to-service communication with auth service.

Documentation: `services/admin/README.md`
Deep dive: `docs/Backend/services/admin.md`

## Shared Operational Notes

- Keep only the gateway externally exposed; keep internal services private.
- Use service-specific `.env.example` files under each service directory.
- For local multi-service setup, run the stack from `docker/`.

## Related Docs

- Security baseline: `services/README.md`
- Backend security hardening checklist: `docs/Backend/Backend_Documentation.md`
