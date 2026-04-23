# Problem Solving Service

## Folder Structure

```text
services/lms/src/lms-ai/problem-solving
├── constants
│   └── message-patterns.ts
├── dto
│   ├── ai.dto.ts
│   ├── problem.dto.ts
│   └── submission.dto.ts
├── schemas
│   ├── ai-interaction.schema.ts
│   ├── problem.schema.ts
│   └── submission.schema.ts
├── ai.service.ts
├── problem-solving.ai-client.ts
├── problem-solving.controller.ts
├── problem-solving.module.ts
├── problem.service.ts
└── submission.service.ts
```

## NATS Patterns

- `problem.create`
- `problem.delete`
- `problem.list`
- `problem.get`
- `submission.create`
- `ai.hint`
- `ai.solution`

## Setup

1. Set env values in `services/lms/.env`.
2. Ensure NATS and MongoDB are running.
3. Run LMS service: `npm run start:dev`.
4. Run API Gateway service: `npm run start:dev`.
5. Use gateway endpoints:
   - `POST /api/v1/problems`
   - `GET /api/v1/problems`
   - `GET /api/v1/problems/:id`
   - `DELETE /api/v1/problems/:id`
   - `POST /api/v1/submissions`
   - `POST /api/v1/ai/hint`
   - `POST /api/v1/ai/solution`

