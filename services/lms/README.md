# Vonova LMS Service

NestJS internal microservice for LMS domains and LMS-AI integrations.

## What This Service Does

- Serves LMS domain logic (courses, lessons, quizzes, assignments, library, enrollment, progress).
- Hosts LMS-AI orchestration modules (roadmap generation, PDF summary/chat flows).
- Communicates over NATS with API Gateway.
- Persists operational and AI-related data in MongoDB.

## Security Baseline

- Global strict validation on incoming NATS payloads.
- NATS credentials supported (`NATS_USER`, `NATS_PASSWORD`).
- SSRF-safe outbound AI URL handling:
  - blocks localhost/private/metadata targets
  - supports allowlisted outbound hosts
- Input/path validation and exception handling on AI routes.

## Important Paths

- `src/main.ts` - NATS microservice bootstrap.
- `src/lms-ai/roadmap/roadmap.service.ts` - roadmap AI orchestration + SSRF safeguards.
- `src/lms-ai/pdf-summary/pdf-summary.service.ts` - PDF AI orchestration + SSRF safeguards.
- `src/common/security/ssrf-protection.util.ts` - shared outbound URL protections.
- `src/common/config/configuration.ts` - env mapping.

## Environment

Copy from `services/lms/.env.example`.

Key vars:

- `NODE_ENV`
- `NATS_URL`
- `NATS_USER`
- `NATS_PASSWORD`
- `MONGO_URI_LOCAL` or `MONGO_URI_REMOTE`
- `MONGO_URI_LMS_AI`
- `ROADMAP_AI_SERVICE_URL`
- `PDF_SUMMARY_AI_SERVICE_URL`
- `AI_SERVICE_ALLOWED_HOSTS`
- `AWS_*` / `S3_*` variables used for LMS-AI uploads and signed links

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
cd services/lms
docker build -t vonova-lms-service .
docker run --rm --env-file .env vonova-lms-service
```

Full stack (recommended):

```bash
cd docker
docker compose up -d --build
```

See `docker/README.md` for private-network and Nginx gateway routing details.
