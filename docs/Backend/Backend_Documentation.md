# Vonova Backend Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Request Flow](#request-flow)
  - [Core Components](#core-components)
- [Service Responsibilities](#service-responsibilities)
  - [API Gateway](#api-gateway)
  - [App Service](#app-service)
  - [LMS Service](#lms-service)
  - [Admin Service](#admin-service)
- [Security Baseline](#security-baseline)
  - [Gateway Security Controls](#gateway-security-controls)
  - [Authentication and Token Strategy](#authentication-and-token-strategy)
  - [SSRF and Outbound Safety](#ssrf-and-outbound-safety)
  - [MongoDB Hardening](#mongodb-hardening)
  - [NATS Security](#nats-security)
- [Environment Configuration](#environment-configuration)
  - [Gateway Variables](#gateway-variables)
  - [App Variables](#app-variables)
  - [LMS Variables](#lms-variables)
  - [Admin Variables](#admin-variables)
- [Deployment and Infrastructure](#deployment-and-infrastructure)
  - [Network Isolation Model](#network-isolation-model)
  - [Docker Deployment](#docker-deployment)
  - [Production Checklist](#production-checklist)
- [Monitoring and Observability](#monitoring-and-observability)
- [Performance Baseline](#performance-baseline)
- [Testing and Validation](#testing-and-validation)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

---

## Overview

Vonova backend is a microservice architecture where the API Gateway is the only public entrypoint. Internal services communicate over NATS and persist data primarily in MongoDB, with Redis and S3 used where needed.

Primary goals:

- security-first defaults
- strict request validation
- safe inter-service communication
- production-ready deployment boundaries

## Architecture

### Request Flow

`Frontend -> API Gateway -> NATS -> Internal Services (App, LMS, Admin) -> MongoDB/Redis/S3/AI providers`

### Core Components

- `services/api-gateway`: HTTP edge, security controls, routing.
- `services/app`: authentication and core account/user domain logic.
- `services/lms`: learning domain and LMS-AI orchestration.
- `services/admin`: protected admin operations and user management.
- `docker/`: local orchestration and network isolation baseline.

## Service Responsibilities

### API Gateway

- Exposes public REST endpoints.
- Applies global validation and security middleware.
- Handles cookie-based auth flow for access/refresh lifecycle.
- Forwards internal commands/events to microservices through NATS.

Main references:

- `services/api-gateway/src/main.ts`
- `services/api-gateway/src/app.module.ts`
- `services/api-gateway/src/common/middleware/`

### App Service

- Handles register/login/refresh/logout/password/account flows.
- Issues and rotates JWT refresh tokens with `jti`.
- Stores refresh tokens hashed in database.
- Supports token revocation with Redis-backed blacklist and in-memory fallback.

Main references:

- `services/app/src/auth/auth.service.ts`
- `services/app/src/auth/token-blacklist.service.ts`
- `services/app/src/auth/schema/`

### LMS Service

- Provides LMS domain features (courses, lessons, quizzes, assignments, progress).
- Integrates LMS-AI workflows (roadmap generation, PDF summary/chat support).
- Enforces safe outbound URL handling for AI provider communication.

Main references:

- `services/lms/src/lms-ai/roadmap/roadmap.service.ts`
- `services/lms/src/lms-ai/pdf-summary/pdf-summary.service.ts`
- `services/lms/src/common/security/ssrf-protection.util.ts`

### Admin Service

- Exposes admin-only user management and statistics endpoints.
- Protects all admin routes by authentication and authorization middleware.
- Uses safe service-to-service communication with auth service allowlisted hosts.

Main references:

- `services/admin/src/routes/admin.route.ts`
- `services/admin/src/utils/service-communication.ts`
- `services/admin/src/utils/ssrf-protection.ts`

## Security Baseline

### Gateway Security Controls

- Strict `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- `helmet` enabled with CSP.
- CORS restricted to trusted origins.
- Rate limiting:
  - global: `100 req/min`
  - auth routes: `5 req/min`
- Optional CSRF middleware via `ENABLE_CSRF=true` (recommended for cookie auth).
- Request sanitization middleware for payload hardening.

### Authentication and Token Strategy

- Access token short TTL (default `15m`).
- Refresh token long TTL (example `7d`) with rotation per refresh call.
- Refresh token persisted hashed (`sha256`) in DB.
- Revoked/used refresh tokens checked against blacklist.
- Blacklist supports Redis for multi-instance deployment.

### SSRF and Outbound Safety

- Outbound service URLs are sanitized and validated.
- Private/unsafe targets are blocked (`localhost`, loopback, metadata, private ranges).
- Optional host allowlist:
  - `AI_SERVICE_ALLOWED_HOSTS` for LMS outbound AI calls.
  - `AUTH_SERVICE_ALLOWED_HOSTS` for admin-to-auth communication.

### MongoDB Hardening

- Schema strict mode enabled for critical auth entities.
- Password fields excluded by default (`select: false`) where applicable.
- Password hashing via bcrypt.
- Unique index on user email.
- Query projection and pagination used for safer, efficient reads.

### NATS Security

- NATS runs on private network.
- Service authentication enabled via `NATS_USER` and `NATS_PASSWORD`.
- Payload validation applied at service boundaries (do not trust transport).

## Environment Configuration

Use each service's `.env.example` as the source of truth.

### Gateway Variables

- `NODE_ENV`
- `PORT`
- `FRONTEND_ORIGIN`
- `CORS_ORIGIN`
- `ENABLE_CSRF`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`

### App Variables

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `MONGO_URI_LOCAL` or `MONGO_URI_REMOTE`
- `REDIS_URL`
- `REDIS_PREFIX`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`

### LMS Variables

- `MONGO_URI_LOCAL` or `MONGO_URI_REMOTE`
- `MONGO_URI_LMS_AI`
- `ROADMAP_AI_SERVICE_URL`
- `PDF_SUMMARY_AI_SERVICE_URL`
- `AI_SERVICE_ALLOWED_HOSTS`
- `AWS_*` / `S3_*`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`

### Admin Variables

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN`
- `AUTH_SERVICE_URL`
- `AUTH_SERVICE_ALLOWED_HOSTS`
- `MONGO_URI_REMOTE_ADMIN_SERVICES`
- `SWAGGER_USER`
- `SWAGGER_PASSWORD`

## Deployment and Infrastructure

### Network Isolation Model

- Expose only `api-gateway` publicly.
- Keep `app`, `lms`, `admin`, `nats`, and MongoDB in private/internal network.
- Do not expose MongoDB public ports.
- Restrict NATS to internal communication only.

### Docker Deployment

Recommended local stack:

```bash
cd docker
docker compose up -d --build
```

Service-only runs remain useful for focused debugging, but full stack is preferred for integration testing.

### Production Checklist

- [x] Gateway validation + sanitization + Helmet/CSP
- [x] CORS allowlist
- [x] Rate limiting
- [x] Refresh token rotation + blacklist
- [x] SSRF protection for outbound service calls
- [x] Internal-only NATS and database exposure model
- [x] Structured logging strategy

## Monitoring and Observability

Track and alert on:

- auth failures and unusual refresh attempts
- rate-limit spikes
- blocked SSRF/outbound requests
- service health and response latency
- NATS connection and message failure rates

Recommended production approach:

- structured JSON logs
- centralized sink (ELK/OpenSearch/Datadog equivalent)
- service-level health endpoints and uptime checks

## Performance Baseline

- Paginate list endpoints by default.
- Keep critical indexes (for example unique indexed email).
- Reduce repeated auth DB lookups using token strategy + cache/blacklist.
- Use Redis for shared state in horizontally scaled deployments.

## Testing and Validation

Minimum validation before release:

- build each service successfully
- smoke test auth flows (login/refresh/logout)
- verify gateway security middleware behaviors
- verify internal service communication over NATS
- test AI-service outbound allowlist/SSRF blocking paths

## Troubleshooting

Common checks:

- CORS errors: verify `FRONTEND_ORIGIN` and `CORS_ORIGIN`.
- Auth refresh issues: verify token TTL settings and cookie policy.
- Internal communication failures: verify `NATS_URL`, credentials, and network.
- AI call failures: verify service URL + allowlist (`AI_SERVICE_ALLOWED_HOSTS`).
- Admin auth bridge errors: verify `AUTH_SERVICE_URL` + `AUTH_SERVICE_ALLOWED_HOSTS`.

## Related Documentation

- Service map: `docs/Backend/services_overview.md`
- Service-level baseline details: `services/README.md`
- Individual service docs:
  - `services/api-gateway/README.md`
  - `services/app/README.md`
  - `services/lms/README.md`
  - `services/admin/README.md`
