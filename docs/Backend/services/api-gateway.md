# API Gateway Service Documentation

## Table of Contents

- [Overview](#overview)
- [Role in Architecture](#role-in-architecture)
- [Core Responsibilities](#core-responsibilities)
- [Request Lifecycle](#request-lifecycle)
- [Security Controls](#security-controls)
- [Main Modules and Files](#main-modules-and-files)
- [Environment Variables](#environment-variables)
- [Run and Deployment](#run-and-deployment)
- [Observability and Troubleshooting](#observability-and-troubleshooting)

## Overview

`api-gateway` is the public HTTP entrypoint for Vonova backend. It receives client requests, applies shared security and validation policies, then forwards operations to internal microservices through NATS.

## Role in Architecture

Architecture flow:

`Frontend -> API Gateway -> NATS -> app / lms / admin services`

The gateway centralizes cross-cutting concerns so internal services stay private and focused on business logic.

## Core Responsibilities

- expose unified HTTP APIs for auth, app, LMS, and LMS-AI domains
- bridge HTTP requests to NATS message patterns
- enforce global transport-level validation and request normalization
- manage cookie-based auth behavior between browser and backend
- provide Swagger documentation and root routing behavior

## Request Lifecycle

1. Client sends HTTP request to gateway route.
2. Gateway applies middleware and security checks.
3. DTO/class-validator processing runs through global `ValidationPipe`.
4. Controller delegates to gateway service.
5. Gateway service publishes request to target microservice over NATS.
6. Gateway transforms/returns response to client.

## Security Controls

Implemented in bootstrap and middleware:

- `helmet` with strict CSP directives
- strict CORS allowlist with dynamic origin validation
- global rate limiting (`100 req/min`)
- stricter auth path limit (`5 req/min` on auth routes)
- global validation (`whitelist`, `forbidNonWhitelisted`, `transform`)
- cookie parser and optional CSRF flow (`ENABLE_CSRF`)
- payload sanitization middleware for suspicious keys and script vectors

Security-critical references:

- `services/api-gateway/src/main.ts`
- `services/api-gateway/src/common/middleware/csrf.middleware.ts`
- `services/api-gateway/src/common/middleware/request-sanitizer.middleware.ts`
- `services/api-gateway/src/common/filters/rpc-exception.filter.ts`

## Main Modules and Files

- bootstrap and runtime
  - `services/api-gateway/src/main.ts`
  - `services/api-gateway/src/app.module.ts`
- auth flow bridge
  - `services/api-gateway/src/app/auth/`
- NATS client and internal communication
  - `services/api-gateway/src/common/nats-client/nats-client.module.ts`
- API docs and utility services
  - `services/api-gateway/src/common/services/swagger.service.ts`
  - `services/api-gateway/src/common/services/logger.service.ts`
- domain gateway controllers (LMS/LMS-AI)
  - `services/api-gateway/src/lms/`
  - `services/api-gateway/src/lms-ai/`

## Environment Variables

Source of truth: `services/api-gateway/.env.example`

Important variables:

- runtime: `PORT`, `NODE_ENV`, `LOG_LEVEL`
- origins: `FRONTEND_ORIGIN`, `CORS_ORIGIN`, `AI_ORIGIN`
- NATS: `NATS_URL`, `NATS_USER`, `NATS_PASSWORD`
- cookies/csrf: `COOKIE_DOMAIN`, `ENABLE_CSRF`
- rate-limit tuning: `RATE_LIMIT_*`, `GLOBAL_RATE_LIMIT_*`, `STRICT_RATE_LIMIT_*`
- Swagger: `SWAGGER_SERVER_LOCAL`, `SWAGGER_SERVER_PRODUCTION`, `SWAGGER_USER`, `SWAGGER_PASSWORD`
- S3 (upload-related routes): `AWS_S3_*`

## Run and Deployment

Development:

```bash
cd services/api-gateway
npm install
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

Docker (recommended full stack):

```bash
cd docker
docker compose up -d --build
```

## Observability and Troubleshooting

- use request logs (`morgan`) and gateway error responses to trace edge failures
- for CORS issues, validate `CORS_ORIGIN` and `FRONTEND_ORIGIN` values
- for auth throttling errors, inspect strict auth limiter thresholds
- for microservice timeout errors, verify NATS connectivity and credentials
