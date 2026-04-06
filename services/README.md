# Vonova Services - Production Security Baseline

This document describes the production-ready backend security and performance hardening applied to `services/`.

## 1) Clean Architecture Folder Structure

```txt
services/
  api-gateway/
    src/
      app/
      common/
        config/
        filters/
        guards/
        middleware/
          bot-protection.middleware.ts
          csrf.middleware.ts
          request-sanitizer.middleware.ts
        nats-client/
      main.ts
  app/                              # Auth + core app microservice
    src/
      auth/
        dto/
        guards/
        schema/
          refreshToken.schema.ts
          user.schema.ts
        strategies/
        auth.service.ts
        token-blacklist.service.ts
      common/
        config/
        middleware/
          request-sanitizer.middleware.ts
      main.ts
  lms/                              # LMS + AI adapters microservice
    src/
      common/
        config/
        security/
          ssrf-protection.util.ts
      lms-ai/
        pdf-summary/
          pdf-summary.service.ts
        roadmap/
          roadmap.service.ts
      main.ts
```

## 2) Key Security Implementations

### A. JWT Access + Refresh (Rotation + Blacklist)

- Access token is short-lived (`15m` default).
- Refresh token is long-lived and stored in `HttpOnly` cookie by the gateway.
- Refresh tokens are rotated on each refresh call.
- Refresh tokens are stored hashed (`sha256`) in DB.
- Used refresh tokens are revoked and blacklisted (Redis-backed when `REDIS_URL` is set, with in-memory fallback).

Implementation files:

- `app/src/auth/auth.service.ts`
- `app/src/auth/schema/refreshToken.schema.ts`
- `app/src/auth/token-blacklist.service.ts`

### B. API Gateway Security (NestJS)

- Global `ValidationPipe` is strict:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- Helmet is enabled with strict CSP.
- Rate limiting:
  - Global: `100 req/min`
  - Auth routes: `5 req/min`
- Strict CORS allowlist (trusted origins only).
- Cookie-based auth preserved with `credentials: true`.
- Optional CSRF protection middleware (enable with `ENABLE_CSRF=true`).
- Request sanitization middleware blocks dangerous object keys and strips basic XSS vectors.

Implementation files:

- `api-gateway/src/main.ts`
- `api-gateway/src/common/middleware/csrf.middleware.ts`
- `api-gateway/src/common/middleware/request-sanitizer.middleware.ts`
- `api-gateway/src/app/auth/auth.controller.ts`

### C. Microservices Zero-Trust Baseline

- Each microservice keeps strict global validation for incoming payloads.
- Message payloads are validated again at the service boundary.
- NATS authentication is supported through env (`NATS_USER`, `NATS_PASSWORD`) so transport is not anonymous.

Implementation files:

- `app/src/main.ts`
- `lms/src/main.ts`

### D. SSRF Protection (Critical)

- Outbound AI service URLs are validated and sanitized.
- Blocked targets include:
  - `localhost`
  - `127.0.0.1`
  - `169.254.169.254`
  - private IPv4 ranges
- Optional outbound domain allowlist via `AI_SERVICE_ALLOWED_HOSTS`.

Implementation files:

- `lms/src/common/security/ssrf-protection.util.ts`
- `lms/src/lms-ai/pdf-summary/pdf-summary.service.ts`
- `lms/src/lms-ai/roadmap/roadmap.service.ts`

### E. MongoDB (Mongoose) Hardening

- `User` schema is `strict: true`.
- Password field is `select: false` by default.
- Password hashing is bcrypt-based with secure salt rounds.
- Email is unique and indexed.
- Sensitive fields are excluded in user-returning queries where appropriate.

Implementation files:

- `app/src/auth/schema/user.schema.ts`
- `app/src/auth/auth.service.ts`

## 3) Environment Variables (Required in Production)

### API Gateway

- `NODE_ENV=production`
- `FRONTEND_ORIGIN=https://your-frontend-domain`
- `CORS_ORIGIN=https://your-frontend-domain`
- `ENABLE_CSRF=true` (recommended when using cookies)
- `NATS_URL=nats://nats:4222`
- `NATS_USER=...`
- `NATS_PASSWORD=...`

### App Service (Auth)

- `JWT_ACCESS_SECRET=...`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_SECRET=...`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `NATS_URL=nats://nats:4222`
- `NATS_USER=...`
- `NATS_PASSWORD=...`
- `MONGO_URI_REMOTE=...`
- `REDIS_URL=redis://redis:6379`
- `REDIS_PREFIX=auth:blacklist`

### LMS Service

- `NATS_URL=nats://nats:4222`
- `NATS_USER=...`
- `NATS_PASSWORD=...`
- `AI_SERVICE_ALLOWED_HOSTS=roadmap-ai.internal,pdf-ai.internal`
- `ROADMAP_AI_SERVICE_URL=http://roadmap-ai.internal:5000`
- `PDF_SUMMARY_AI_SERVICE_URL=http://pdf-ai.internal:5015`

### Admin Service (Inter-service SSRF Safe)

- `AUTH_SERVICE_URL=http://app.internal`
- `AUTH_SERVICE_ALLOWED_HOSTS=app.internal`

## 4) Docker / Network Isolation Requirements

- Expose **only API Gateway** to public internet.
- Keep `app`, `lms`, `nats`, and `mongodb` on private/internal networks.
- Never expose MongoDB public port.
- Restrict NATS to internal network and require credentials.

Recommended baseline:

- one public network for gateway
- one internal network for microservices + NATS + MongoDB
- firewall rules denying direct public access to internal services

## 5) Logging and Monitoring

- Log authentication attempts and failures.
- Log suspicious activity (rate-limit hits, invalid token refresh, blocked SSRF requests).
- Use structured logging sink in production (JSON to ELK/Datadog/OpenSearch).

## 6) Performance Baseline

- Keep pagination for list endpoints.
- Maintain proper Mongo indexes (email already indexed/unique).
- Reuse tokens/queries efficiently (rotation + minimal auth DB lookups).
- Add Redis for shared blacklist/cache in multi-instance deployments.

## 7) Validation Status

- `api-gateway` build: pass
- `app` build: pass
- `lms` build: pass
