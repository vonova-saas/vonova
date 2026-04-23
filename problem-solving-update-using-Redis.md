# 🚀 Online Judge System - Redis Production Upgrade Plan

## 📌 Overview

This document describes the next-phase upgrade of the LMS Problem Solving system from a MongoDB/in-memory queue architecture to a production-grade Redis-based distributed system (LeetCode-style).

The goal is to achieve:
- High scalability
- Reliable job processing
- Fault tolerance
- Multi-worker execution
- Real-time judge system

---

# 🧠 Current State (Baseline)

The system currently supports:
- Test-case-based evaluation
- Docker-based code execution
- Async submission flow (MongoDB or in-memory queue)
- Frontend polling system
- Basic multi-language support (JS/Python partial)

Limitations:
- No distributed workers
- Limited scalability
- No persistent queue recovery (if not using Redis yet)

---

# 🎯 Target Architecture (With Redis)

We will move to:

## 🔥 Core Components

- Redis (BullMQ) → Job Queue
- Worker Service → Code execution engine
- API Gateway → Submission entry point
- LMS Service → Problem + evaluation logic
- Docker Sandbox → Isolated execution

---

# ⚙️ 1. Redis Queue System

## Responsibilities:
- Store all submission jobs
- Guarantee persistence
- Enable retries
- Support concurrency

### Job Flow:

1. User submits code
2. API pushes job to Redis queue
3. Worker picks job
4. Executes in Docker
5. Stores result back in DB
6. Updates job status

---

# ⚙️ 2. Worker Architecture (Distributed)

## Features:

- Multiple workers can run in parallel
- Each worker processes independent jobs
- Auto-scaling ready

### Worker responsibilities:

- Fetch job from Redis queue
- Run Docker container
- Execute test cases
- Collect results
- Save to database

---

# ⚙️ 3. Queue Structure (BullMQ)

### Queue Name: