# App Service Documentation

## Table of Contents

- [Overview](#overview)
- [Role in Architecture](#role-in-architecture)
- [Core Domain Responsibilities](#core-domain-responsibilities)
- [Auth and Token Lifecycle](#auth-and-token-lifecycle)
- [Security Baseline](#security-baseline)
- [Main Modules and Files](#main-modules-and-files)
- [Data and Integrations](#data-and-integrations)
- [Environment Variables](#environment-variables)
- [Run and Deployment](#run-and-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

`app` is a NestJS internal microservice focused on identity and core product domains. It is not intended for direct public exposure and is designed to communicate through NATS.

## Role in Architecture

`api-gateway` forwards internal auth/account commands to `app` over NATS.  
`app` owns identity consistency and sensitive token workflows.

## Core Domain Responsibilities

Main responsibilities include:

- authentication (register, login, refresh, logout, email verification, reset password)
- user profile and account lifecycle handling
- support modules such as notifications, settings, feedback, waitlist, and community posts
- schema ownership for user and token persistence rules

## Auth and Token Lifecycle

Current strategy:

- short-lived JWT access token (default `15m`)
- longer-lived refresh token (default `7d`)
- refresh-token rotation with unique `jti`
- hashed refresh-token storage (`sha256`) in DB
- revoked token checks through blacklist service
- Redis blacklist backend when available, in-memory fallback otherwise

Key files:

- `services/app/src/auth/auth.service.ts`
- `services/app/src/auth/token-blacklist.service.ts`
- `services/app/src/auth/schema/refreshToken.schema.ts`
- `services/app/src/auth/schema/user.schema.ts`

## Security Baseline

- strict global validation in microservice bootstrap
- NATS transport configured with optional user/password authentication
- payload sanitization middleware for exposed HTTP surface (if enabled in app modules)
- bcrypt password hashing and secure schema defaults (`strict`, hidden password field)
- exception filters to normalize error behavior for RPC context

Security references:

- `services/app/src/main.ts`
- `services/app/src/common/filters/rpc-exception.filter.ts`
- `services/app/src/common/middleware/request-sanitizer.middleware.ts`

## Main Modules and Files

- entry and module graph
  - `services/app/src/main.ts`
  - `services/app/src/app.module.ts`
- auth domain
  - `services/app/src/auth/`
- notifications and communication
  - `services/app/src/notification/`
  - `services/app/src/notification/email-sender.service.ts`
- supporting business domains
  - `services/app/src/settings/`
  - `services/app/src/feedback/`
  - `services/app/src/support/`
  - `services/app/src/waitlist/`
  - `services/app/src/Community/`

## Data and Integrations

- MongoDB via Mongoose schemas and service-level repositories/patterns
- NATS for internal asynchronous communication
- optional Redis for distributed token blacklist state
- optional external integrations (Google OAuth, email provider, S3) controlled by env vars

## Environment Variables

Source of truth: `services/app/.env.example`

Important variables:

- runtime: `NODE_ENV`, `FRONTEND_URL`
- NATS: `NATS_URL`, `NATS_USER`, `NATS_PASSWORD`
- MongoDB: `MONGO_URI_LOCAL_APP`, `MONGO_URI_REMOTE_APP`, `MONGO_DB_NAME_APP`
- JWT: `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_GOOGLE_CALLBACK_URL`
- email: `RESEND_API_KEY`, `EMAIL_FROM`
- S3: `AWS_S3_*_APP`
- blacklist backend: `REDIS_URL`, `REDIS_PREFIX`

## Run and Deployment

Development:

```bash
cd services/app
npm install
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

Docker full stack:

```bash
cd docker
docker compose up -d --build
```

## Troubleshooting

- token refresh failures: check JWT secrets/expirations and blacklist backend health
- NATS message failures: verify URL and credentials match gateway configuration
- auth schema issues: verify MongoDB URI and index/migration state
- unexpected auth errors: inspect RPC exception filter output and gateway-mapped response
