<p align="center">
  <img src="https://raw.githubusercontent.com/vonova-saas/.github/refs/heads/main/img/github_organization.png" alt="Vonova Logo" width="100%" />
</p>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Setup & Development](#setup--development)
- [Docs](#docs)
- [Contributing](#contributing)
- [License](#license)

---

## About

**Vonova** is a SaaS LMS platform that transforms fragmented learning into structured, engaging, and personalized journeys.

We solve:
✅ Scattered, inefficient learning  
✅ Lack of personalization and guidance  
✅ Weak practical coding experience  
✅ Outdated static content

---

## Features

✨ AI Topic Video Generation  
✨ Personalized AI Assistant & Learning Roadmaps  
✨ Interactive Coding Challenges with AI Hints  
✨ Instructor Course Marketplace with Screen Recording App  
✨ Digital Library with Recommendations  
✨ Assessments & Adaptive Quizzes  
✨ Real-Time Chat and Community Forum

---

## Monorepo Structure

Vonova is organized as a **polyglot monorepo** containing:

```

vonova/
├── .github/      # GitHub workflows, PR templates, issue templates
├── apps/         # Frontend clients (web, desktop, mobile)
├── services/     # Microservices (Node, Go, Rust, Python)
├── packages/     # Shared libraries
├── infra/        # Docker, K8s, deployment configs
├── scripts/      # Automation, migrations
├── docs/         # Design docs, PRD, architecture

```

✅ Supports multiple languages and frameworks  
✅ Clean microservice boundaries  
✅ Designed for local Docker Compose and production K8s

📑 See [REPO_STRUCTURE.md](REPO_STRUCTURE.md) for details.

---

## Tech Stack

### Frontend
- React 19 / Next.js 15 / TypeScript
- Tailwind CSS / ShadCN UI
- Electron.js desktop version of vonova
- React Expo app for mobile version of vonova
- Zustand / Redux Toolkit for state

### Backend (Microservices)
- Node.js (Auth, Notifications, Payment, User)
- Go Fiber (Courses, Library, Community)
- Rust Axum (Chat service)
- Python (AI assistant, AI problem-solving)

### AI/ML
- PyTorch / Transformers
- Custom video generation pipelines
- GPT-based assistants

### Infra
- Docker / Docker Compose
- Kubernetes-ready (K8s/)
- PostgreSQL, MongoDB, Redis
- Kafka for messaging
- GitHub Actions for CI/CD

---

## Setup & Development

### Prerequisites

- Docker & Docker Compose
- Node.js (v20+ recommended)
- Go, Rust, Python 3.10+
- Git

---

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/vonova-saas/vonova.git
cd vonova
```

<br>

### 2️⃣ Create Your Env File

```bash
cp .env.example .env
# Fill in secrets and service configs
```

<br>

### 3️⃣ Run with Docker Compose

```bash
docker-compose up --build
```

<br>

### 4️⃣ Local Dev for Individual Services

Example for a Node.js service:

```bash
cd services/auth
npm install
npm run dev
```

Example for web-client:

```bash
cd apps/web-client
npm install
npm run dev
```

<br>

### 5️⃣ Useful Makefile Commands

```bash
make up        # Start all services with docker-compose
make down      # Stop all services
make lint      # Run all linters
make test      # Run all tests
```

---

## Docs

📌 For detailed documentation, see:

* [Product Requirements Document](docs/PRD.md)
* [Monorepo Structure](docs/PROJECT_STRUCTURE.md)
* [Tech Specs & Architecture](docs/tech/)
* [User Stories](docs/user-stories/)
* [Design Docs](docs/design/)
* [Legal & Compliance](docs/legal/)
* [Team Logs & Decisions](docs/logs/)

---

## Contributing

✅ Check out [CONTRIBUTING.md](CONTRIBUTING.md) for:

* Branch naming
* Commit guidelines
* PR process
* Code review best practices

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built with ❤️ by the Vonova Team
</p>
