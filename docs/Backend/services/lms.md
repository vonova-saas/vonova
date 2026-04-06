# LMS Service Documentation

## Table of Contents

- [Overview](#overview)
- [Role in Architecture](#role-in-architecture)
- [Core Domain Responsibilities](#core-domain-responsibilities)
- [LMS-AI Responsibilities](#lms-ai-responsibilities)
- [Security Baseline](#security-baseline)
- [Main Modules and Files](#main-modules-and-files)
- [Data and Storage Layers](#data-and-storage-layers)
- [Environment Variables](#environment-variables)
- [Run and Deployment](#run-and-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

`lms` is a NestJS internal microservice that handles learning-domain features and LMS-AI orchestration flows. It communicates with other services through NATS and stores data in MongoDB.

## Role in Architecture

The API Gateway receives client requests, then forwards LMS and LMS-AI commands to `lms` through NATS.  
`lms` responds with domain data (courses/quizzes/library/progress) and AI-generated outputs.

## Core Domain Responsibilities

Major LMS responsibilities include:

- course and lesson domain workflows
- quiz authoring and evaluation flows
- assignment and enrollment operations
- learning progress related handlers
- library assets such as books, guides, presentations, favorites, and uploads

## LMS-AI Responsibilities

The service also orchestrates AI-backed features:

- learning roadmap generation workflows
- PDF summary and QA/chat workflows
- persistence of AI histories, summaries, and related metadata
- AI-safe URL call handling before contacting external/internal AI services

## Security Baseline

- internal microservice-only bootstrap over NATS (no public HTTP listener)
- strict global validation (`whitelist`, `forbidNonWhitelisted`, `transform`)
- global RPC exception filter for normalized error handling
- SSRF protection utility for outbound AI endpoints
- optional allowlist enforcement for AI service hosts

Security references:

- `services/lms/src/main.ts`
- `services/lms/src/common/security/ssrf-protection.util.ts`
- `services/lms/src/lms-ai/roadmap/roadmap.service.ts`
- `services/lms/src/lms-ai/pdf-summary/pdf-summary.service.ts`

## Main Modules and Files

- app bootstrap and module composition
  - `services/lms/src/main.ts`
  - `services/lms/src/app.module.ts`
- core domains
  - `services/lms/src/course/`
  - `services/lms/src/quiz/`
  - `services/lms/src/library/`
  - `services/lms/src/enrollment/`
  - `services/lms/src/progress/`
- AI domains
  - `services/lms/src/lms-ai/roadmap/`
  - `services/lms/src/lms-ai/pdf-summary/`
  - `services/lms/src/lms-ai/database/`

## Data and Storage Layers

- primary domain data in MongoDB (LMS DB)
- optional separated MongoDB URIs for AI sub-domains
- S3 integration for assets and AI-related files/uploads
- NATS queue (`vonova-lms-queue`) for workload distribution

## Environment Variables

Source of truth: `services/lms/.env.example`

Important variables:

- runtime: `NODE_ENV`
- NATS: `NATS_URL`, `NATS_USER`, `NATS_PASSWORD`
- MongoDB LMS: `MONGO_URI_LOCAL_LMS`, `MONGO_URI_REMOTE_LMS`, `MONGO_DB_NAME_LMS`
- MongoDB LMS-AI: `MONGO_URI_LMS_AI`, `MONGO_URI_REMOTE_LMS_AI`
- optional feature DB URIs: `MONGO_URI_*_LMS_AI`
- AI endpoints: `ROADMAP_AI_SERVICE_URL_LMS_AI`, `PDF_SUMMARY_AI_SERVICE_URL_LMS_AI`
- AI outbound allowlist: `AI_SERVICE_ALLOWED_HOSTS_LMS_AI`
- S3/AWS: `AWS_*_LMS`, `AWS_*_LMS_AI`, `AWS_S3_PRESIGN_EXPIRES_LMS_AI`

## Run and Deployment

Development:

```bash
cd services/lms
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

- AI endpoint errors: verify AI service URLs and host allowlist values
- database routing issues: verify which Mongo URI is selected for each AI feature
- missing queue responses: verify NATS URL/auth and active queue consumers
- S3 upload/signing failures: verify AWS credentials, region, and bucket env vars
