# 📂 Vonova Monorepo Project Structure

This document describes the **Vonova** monorepo folder and file layout.  
It explains what each top-level folder or file is for, and how we use it as a team.

Designed to support:
- Multi-language microservices
- Multiple client apps
- Shared libraries
- Modern DevOps with Docker/K8s
- Good documentation & team collaboration

---

## 🌳 Top-Level Structure

```
vonova/
├── .github/                 # GitHub workflows, PR templates, issue templates
├── .vscode/                 # VSCode settings, recommended extensions
├── apps/                    # Frontend clients (web, desktop, mobile)
│   ├── web-client/          # Next.js 15 React app (student/instructor/admin dashboards)
│   ├── desktop-recorder/    # Electron.js instructor screen recording app
│   └── mobile-client/       # React Native / Expo app (future scope)
├── services/                # Microservices Backend (Node.js, Go Fiber, Rust Axum, Fast API)
│   ├── ai-assistant/        # Python (GPT roadmap generation)
│   ├── ai-problem-solving/  # Python (code hints/feedback)
│   ├── ai-topic-video-gen/  # Go/Python (video generation backend)
│   ├── auth/                # Node.js JWT auth service
│   ├── chat/                # Rust (real-time messaging)
│   ├── community/           # Go Fiber (forum)
│   ├── courses/             # Go Fiber (course mgmt)
│   ├── library/             # Go Fiber (book recs)
│   ├── notification/        # Node.js email + in-app notifications
│   ├── payment/             # Node.js/Go (Stripe integration)
│   └── user/                # Node.js user profiles & preferences
├── packages/                # Shared code/libs (TypeScript types, API clients)
├── infra/                   # Docker Compose, Kubernetes, Terraform (optional)
│   ├── docker-compose.yml
│   └── k8s/
├── scripts/                # Utility scripts (migrations, seeds, CI helpers)
├── docs/                   # PRD, design docs, architecture diagrams
│   ├── design/             # UI/UX wireframes, branding
│   ├── idea/               # The vonova idea and description of it
│   ├── legal/              # Compliance & Legal Documentation
│   ├── logs/               # For Decision Logs & Meeting notes & key decisions
│   ├── tech/               # Technical stack & backend/frontend structure
│   ├── user-stories/       # Feature & User Flow Documentation
│   └── PRD.md
├── .dockerignore
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── Makefile
└── README.md
```

---

## 📁 Folder and File Explanations

### ✅ .github/
- **Purpose**: GitHub configuration
- Contains:
  - Workflows for CI/CD (GitHub Actions)
  - Issue and PR templates
- Helps enforce consistent development practices

---

### ✅ .vscode/
- **Purpose**: Recommended VSCode settings
- Examples:
  - Extensions.json
  - Settings.json
- Ensures all team members share consistent editor setup

---

### ✅ apps/
- **Purpose**: All user-facing client applications
- Contains:
  - `web-client/`: Next.js 15 React app for students, instructors, admins
  - `desktop-recorder/`: Electron.js app (future scope)
  - `mobile-client/`: React Native/Expo app (future scope)

---

### ✅ services/
- **Purpose**: All backend microservices
- Polyglot-friendly — supports Node.js, Go, Rust, Python
- Each folder = single service, with its own:
  - Source code
  - Dockerfile
  - Tests
  - README

#### Example Services
- `ai-assistant/` – Python (GPT-powered roadmap generation)
- `ai-problem-solving/` – Python (AI hints/feedback for coding)
- `ai-topic-video-gen/` – Go/Python (AI video generation)
- `auth/` – Node.js JWT auth
- `chat/` – Rust (real-time messaging)
- `community/` – Go Fiber (forum / Q&A)
- `courses/` – Go Fiber (course management)
- `library/` – Go Fiber (book recommendations)
- `notification/` – Node.js (email + in-app notifications)
- `payment/` – Node.js/Go (Stripe integration)
- `user/` – Node.js (profiles, preferences)

---

### ✅ packages/
- **Purpose**: Shared code and libraries
- Examples:
  - TypeScript types shared across frontend/backend
  - OpenAPI client SDKs
  - Utility functions
  - Shared UI components (if needed)

---

### ✅ infra/
- **Purpose**: Infrastructure-as-Code and deployment setup
- Contains:
  - `docker-compose.yml` – Local dev environment orchestration
  - `k8s/` – Kubernetes manifests (optional for production)
  - Terraform or Ansible scripts if needed later

✅ Allows consistent local dev and smooth production deployment

---

### ✅ scripts/
- **Purpose**: Developer and DevOps automation
- Examples:
  - Database migrations
  - Seeders
  - Cleanup scripts
  - CI helpers

✅ Keeps repetitive tasks automated and standardized

---

### ✅ docs/
- **Purpose**: Central place for *all project documentation*
- Structured to cover full SDLC, team knowledge, legal, and product planning

#### Subfolders:
- `design/` – UI/UX wireframes, branding assets
- `idea/` – High-level concept, vision, and product description
- `legal/` – Compliance notes, GDPR readiness, legal docs
- `logs/` – Decision logs, meeting notes, key architecture choices
- `tech/` – Technical stack descriptions, backend/frontend structure, architecture diagrams
- `user-stories/` – User flows, feature specs, user story mapping

#### File:
- `PRD.md` – **Product Requirements Document** (central spec for the whole team)

✅ Supports agile, transparent, well-documented planning

---

### ✅ .dockerignore
- Ignore files when building Docker images
- Reduces image size, speeds up builds

---

### ✅ .env.example
- Template for all environment variables
- Helps new developers set up quickly
- Documents all required configuration

---

### ✅ .gitignore
- Defines which files/directories Git will ignore
- Typically includes:
  - Node modules
  - Logs
  - Build artifacts

---

### ✅ CHANGELOG .md
- Tracks version history
- Documents what changes in each release
- Supports good semantic versioning

✅ Professional teams use this to communicate changes clearly

---

### ✅ CONTRIBUTING .md
- Explains:
  - How to clone and set up the repo
  - Branch naming conventions
  - Commit guidelines
  - How to submit a PR
  - Code review process

✅ Makes onboarding new contributors easier

---

### ✅ LICENSE
- Declares the legal license for the repository
- MIT license

✅ Essential for open source or commercial clarity

---

### ✅ Makefile
- Central place for CLI commands
- Examples:
  - `make up` – start docker-compose
  - `make down` – stop services
  - `make lint` – run linters
  - `make test` – run tests

✅ Developer quality-of-life improvement

---

### ✅ README .md
- Project overview
- Quickstart instructions
- Team info, links to docs
- How to run locally

✅ First impression of the project — critical for professionalism

---

## 🚀 Why this structure?
✔️ Supports multiple languages & frameworks  
✔️ Clean microservice boundaries  
✔️ Easy to onboard new devs  
✔️ Designed for Docker/K8s from day 1  
✔️ Excellent documentation culture  
✔️ Future-proof for real SaaS product scaling

---

## ✅ How to Use This Document
- Review as a team
- Adopt naming and structure consistently
- Keep it updated as the project grows
