# Admin Service Documentation

## Table of Contents

- [Overview](#overview)
- [Role in Architecture](#role-in-architecture)
- [Core Responsibilities](#core-responsibilities)
- [Routing and Access Model](#routing-and-access-model)
- [Security Baseline](#security-baseline)
- [Inter-Service Communication](#inter-service-communication)
- [Main Modules and Files](#main-modules-and-files)
- [Environment Variables](#environment-variables)
- [Run and Deployment](#run-and-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

`admin` is an internal Express + TypeScript service responsible for admin-only operations, mainly user management and platform-level statistics. It is protected by authentication and authorization middleware and integrates with auth service endpoints for token/role validation workflows.

## Role in Architecture

Admin clients call admin endpoints through backend infrastructure policies.  
`admin` handles authorization-sensitive operations and can consult auth service through secure internal HTTP communication.

## Core Responsibilities

- list/search/filter users
- view user details by ID
- update user role
- activate/deactivate user status
- delete user records
- retrieve statistics for users, instructors, and students

## Routing and Access Model

Base route:

- `/admin`

Access chain:

1. `isAuthenticated` middleware validates authenticated user context.
2. `isAdmin` middleware enforces admin-only access.
3. `validateRequest` applies schema validation for relevant endpoints.
4. controller/service executes business logic.

Key route definition:

- `services/admin/src/routes/admin.route.ts`

## Security Baseline

- centralized security stack (`applySecurityStack`) at app bootstrap
- CORS security middleware with allow/deny controls
- bot and abuse protection middleware
- request validation with zod-based schemas
- global error handler for normalized responses
- Swagger docs protected with basic auth in non-development environments
- SSRF-safe outbound URL construction for auth service calls

Security references:

- `services/admin/src/index.ts`
- `services/admin/src/middlewares/security/`
- `services/admin/src/validation/admin.validation.ts`
- `services/admin/src/utils/ssrf-protection.ts`

## Inter-Service Communication

`admin` communicates with auth service via `service-communication` utilities:

- validate role-change policies remotely
- fetch user permission details if needed
- verify JWT tokens through auth service endpoint

Safety model:

- base URL from env
- optional allowed-hosts list from env
- outbound URL built through SSRF-safe utility

Reference:

- `services/admin/src/utils/service-communication.ts`

## Main Modules and Files

- app entry and middleware composition
  - `services/admin/src/index.ts`
- admin APIs
  - `services/admin/src/routes/admin.route.ts`
  - `services/admin/src/controllers/admin.controller.ts`
  - `services/admin/src/services/admin.service.ts`
- validation and auth guards
  - `services/admin/src/validation/admin.validation.ts`
  - `services/admin/src/middlewares/auth/`
- infra config
  - `services/admin/src/config/env.config.ts`
  - `services/admin/src/config/database.config.ts`
  - `services/admin/src/config/redis.config.ts`

## Environment Variables

Source of truth: `services/admin/.env.example`

Important variables:

- runtime: `PORT`, `NODE_ENV`, `FRONTEND_ORIGIN`
- docs auth: `SWAGGER_USER`, `SWAGGER_PASSWORD`
- MongoDB: `MONGO_URI_REMOTE_ADMIN_SERVICES`
- Redis/Upstash: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- service communication: `AUTH_SERVICE_URL`, `AUTH_SERVICE_ALLOWED_HOSTS`
- CORS controls: `CORS_ORIGIN` and related CORS options

## Run and Deployment

Development:

```bash
cd services/admin
npm install
npm run dev
```

Production:

```bash
npm run build
npm run start
```

Docker full stack:

```bash
cd docker
docker compose up -d --build
```

## Troubleshooting

- auth verification failures: validate `AUTH_SERVICE_URL` and reachability
- SSRF-safe URL errors: ensure host is included in `AUTH_SERVICE_ALLOWED_HOSTS`
- admin access denied unexpectedly: verify token parsing and role mapping
- CORS rejections: verify `CORS_ORIGIN` and frontend origin values
