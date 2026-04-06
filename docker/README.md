# Docker Deployment Guide

This folder contains a secure baseline deployment for Vonova backend services.

## Architecture

- Public entrypoint: `nginx` on port `80`
- Internal-only services:
  - `api-gateway`
  - `app-service`
  - `lms-service`
  - `nats`
  - `mongodb`
  - `redis`
- Network isolation:
  - `public_net`: only `nginx` is exposed
  - `private_net` (`internal: true`): all backend traffic

## Files

- `docker-compose.yml` - full stack composition.
- `nginx/nginx.conf` - reverse proxy to API Gateway only.

## Prerequisites

- Docker + Docker Compose plugin installed.
- Service env files configured:
  - `services/api-gateway/.env`
  - `services/app/.env`
  - `services/lms/.env`

## Run

From `docker/`:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

Stop + remove volume:

```bash
docker compose down -v
```

## Security Notes

- Do not publish `mongodb`, `nats`, `redis`, `app-service`, or `lms-service` ports.
- Keep strong values for:
  - `MONGO_ROOT_PASSWORD`
  - `NATS_PASSWORD`
  - JWT secrets in each service `.env`
- Use HTTPS termination in production (load balancer or TLS-enabled Nginx).
- Keep `AI_SERVICE_ALLOWED_HOSTS` strict in `services/lms/.env`.
