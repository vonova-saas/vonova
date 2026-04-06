# Vonova App Service

NestJS internal microservice for Auth + App domain logic (settings, account, billing, support, feedback).

## What This Service Does

- Handles user identity flows (register, login, verify email, reset password, OAuth completion).
- Issues JWT access + refresh tokens.
- Persists users and auth data in MongoDB with Mongoose.
- Consumes/serves messages over NATS for gateway communication.

## Security Baseline

- Global validation for HTTP and NATS payloads.
- Refresh-token rotation with `jti`.
- Refresh tokens stored hashed (`sha256`) in DB.
- Token revocation + blacklist checks.
- Blacklist backend:
  - Redis-backed when `REDIS_URL` is configured
  - in-memory fallback when Redis is unavailable
- Password hashing via bcrypt.
- Secure user schema defaults:
  - `strict: true`
  - `password` with `select: false`
  - unique indexed email
- Request sanitization middleware for HTTP surface.

## Important Paths

- `src/main.ts` - microservice + optional HTTP bootstrap.
- `src/auth/auth.service.ts` - token logic, refresh rotation, auth flows.
- `src/auth/token-blacklist.service.ts` - Redis/in-memory blacklist.
- `src/auth/schema/` - user + token + auth schemas.
- `src/common/config/configuration.ts` - env mapping.

## Environment

Copy from `services/app/.env.example`.

Key vars:

- `NODE_ENV`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`
- `MONGO_URI_LOCAL` or `MONGO_URI_REMOTE`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (recommended `15m`)
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN` (recommended `7d`)
- `REDIS_URL` (optional but recommended in multi-instance deployment)
- `REDIS_PREFIX`

## Run

```bash
npm install
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

## Run With Docker

Service-only example:

```bash
cd services/app
docker build -t vonova-app-service .
docker run --rm --env-file .env vonova-app-service
```

Full stack (recommended):

```bash
cd docker
docker compose up -d --build
```

See `docker/README.md` for internal-only exposure model.
