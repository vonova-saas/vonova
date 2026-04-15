# Vonova API Gateway

NestJS API Gateway for Vonova microservices.  
This service is the only public entrypoint and routes HTTP traffic to internal NATS-connected services.

## What This Service Does

- Exposes HTTP APIs for auth, app, LMS, and LMS-AI domains.
- Enforces gateway-level security (validation, CORS, Helmet/CSP, rate limiting, optional CSRF).
- Manages cookie-based auth flow (access + refresh cookies).
- Forwards requests to internal microservices over NATS.

## Security Baseline

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- Helmet with CSP enabled in `src/main.ts`.
- Rate limits:
  - Global: `100 req/min`
  - Auth routes: `5 req/min`
- Strict CORS allowlist using `CORS_ORIGIN` / `FRONTEND_ORIGIN`.
- Optional CSRF middleware when cookies are used (`ENABLE_CSRF=true`).
- Request sanitization middleware to reduce XSS/NoSQL-injection style payloads.

## Important Paths

- `src/main.ts` - bootstrap + security middleware.
- `src/app.module.ts` - module graph + global middleware wiring.
- `src/common/nats-client/` - NATS client config.
- `src/app/auth/` - auth gateway controllers/services.
- `src/common/guards/` - auth guards.

## Environment

Copy from `services/api-gateway/.env.example`.

Key vars:

- `PORT`
- `NODE_ENV`
- `FRONTEND_ORIGIN`
- `CORS_ORIGIN`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`
- `ENABLE_CSRF`
- `COOKIE_DOMAIN`

## Run

```bash
npm install
pnpm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

## Run With Docker

Service-only example:

```bash
cd services/api-gateway
docker build -t vonova-api-gateway .
docker run --rm -p 4000:4000 --env-file .env vonova-api-gateway
```

Full stack (recommended):

```bash
cd docker
docker compose up -d --build
```

See `docker/README.md` for network isolation and Nginx setup.
