# 🤝 Contributing to Vonova

Welcome! Thank you for considering contributing to **Vonova**, our AI-powered, next-generation Learning Management System for developers and CS students.  

We want Vonova to be a professional, well-organized project that teaches us *real software engineering practices*, while delivering a product that users truly love.  

---

## 📜 Table of Contents

- [How to Contribute](#how-to-contribute)
- [Branching Strategy](#branching-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Issue Reporting](#issue-reporting)
- [Local Setup](#local-setup)

---

## How to Contribute

There are many ways to help:

✨ Code development (frontend, backend, AI)  
✨ Bug reporting and testing  
✨ Writing or improving documentation  
✨ Designing UI/UX  
✨ Improving DevOps and CI/CD  

---

## Branching Strategy

We use **GitHub Flow** with a small team-friendly twist:

- `main` — always stable, production-ready
- `dev` — shared integration branch (optional, for feature merging before `main`)
- `feature/*` — new features
- `bugfix/*` — bug fixes
- `docs/*` — documentation updates
- `hotfix/*` — critical production fixes

✅ Example branches:

```

feature/ai-video-generation
bugfix/login-refresh-token
docs/update-prd

```

---

## Commit Guidelines

✅ Use clear, conventional commits.  
Example:

```

feat(auth): add JWT refresh token
fix(chat): handle disconnect error
docs(prd): update AI service description

```

✅ Good practice:
- Use present tense ("add", not "added")
- Keep it concise but meaningful

---

## Pull Request Process

1️⃣ Make sure your branch is up to date with `main` (or `dev` if using):  
```bash
git pull origin main
```

2️⃣ Push your branch:

```bash
git push origin feature/your-feature-name
```

3️⃣ Open a **Pull Request (PR)** on GitHub:

* Use a clear title and description
* Link related issues if any
* Add screenshots / test results if needed

4️⃣ At least **1 code review** before merging

5️⃣ Once approved, **squash and merge** into `main` (or `dev`).

✅ PR Template (if present in .github/): Please use it!

---

## Code Review Guidelines

✅ Be constructive and respectful.
✅ Focus on:

* Correctness
* Readability
* Consistency with our style
* Security
* Performance

✅ Don’t just approve—ask questions or suggest improvements!

✅ Remember:

> "Code review is for learning, not just checking."

---

## Issue Reporting

✨ Found a bug? Idea for improvement?
1️⃣ Check if there’s already an issue.
2️⃣ If not, open one!
✅ Use the Issue Template (if present)
✅ Be clear and detailed:

* Steps to reproduce
* Expected vs. actual behavior
* Screenshots if possible

---

## Local Setup

Clone the repo:

```bash
git clone https://github.com/YOUR_ORG/vonova.git
cd vonova
```

Copy environment variables:

```bash
cp .env.example .env
```

Run with Docker Compose:

```bash
make up
```

Stop:

```bash
make down
```

Run linters:

```bash
make lint
```

Run tests:

```bash
make test
```

---

## Style & Linting

✅ Node.js/React/Next services: ESLint, Prettier
✅ Python services: Black, Flake8
✅ Rust services: cargo fmt, clippy
✅ Go services: go fmt, golangci-lint

Please **run linters before pushing!**

---

## Tests

✅ Unit tests in each service
✅ Integration tests where possible
✅ E2E tests (planned for future)

Run all tests:

```bash
make test
```

✅ Add tests with new features when possible!
