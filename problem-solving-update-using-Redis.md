You are a principal system architect specializing in large-scale Online Judge platforms (LeetCode / Codeforces / HackerRank level).

I already have a working multi-language judge system with:
- unified execution contract (stdin JSON → invocationArgs → stdout JSON)
- JS/TS + Python + Java + C++ support
- Docker + Worker Thread execution
- deterministic judge engine with caseResults
- parameterNames validation
- output normalization + deep comparison

Now I need a FINAL PRODUCTION HARDENING + ARCHITECTURE REVIEW.

---

## 🎯 YOUR GOAL

Design the FINAL production-grade architecture that is:

- Fully deterministic
- Secure against all sandbox exploits
- Fair across all languages
- Horizontally scalable
- Equivalent to LeetCode backend reliability

---

## 🔥 REQUIRED DELIVERABLES

### 1. FINAL ARCHITECTURE
Provide a complete system design including:
- API Gateway
- Submission Service
- Queue system
- Worker clusters
- Execution sandboxes
- Judge engine
- Result storage

---

### 2. EXECUTION MODEL (CRITICAL)
Ensure:

- ALL languages use EXACT same contract:
  stdin JSON → function execution → stdout JSON
- NO language-specific argument inference
- NO fn.length hacks
- NO signature guessing

Languages:
- JS/TS
- Python
- Java
- C++

---

### 3. SANDBOX SECURITY (CRITICAL)

Define a hardened isolation model:

- JS/TS isolation (Worker Threads OR separate process)
- Docker isolation for Python/Java/C++
- Optional: gVisor or Firecracker upgrade path
- strict CPU/memory/time limits
- no shared state between submissions

---

### 4. QUEUE & SCALING DESIGN

Design:
- Redis/BullMQ or equivalent queue system
- worker concurrency strategy
- autoscaling rules (CPU, queue length, latency)
- idempotent job execution
- retry policy and failure handling

---

### 5. JUDGE ENGINE (CORE LOGIC)

Must enforce:

- deterministic test case order
- strict output normalization (JSON-safe)
- deep equality comparison only
- structured per-case result:

{
  passed: boolean,
  output: any,
  expected: any,
  error: string | null,
  input: any
}

- status priority:
  MLE > TLE > RE > WA > AC

---

### 6. SECURITY MODEL (VERY IMPORTANT)

Prevent:

- infinite loops / CPU abuse
- memory bombs
- prototype pollution (__proto__, constructor, prototype)
- Unicode / bidi injection attacks
- non-serializable outputs (BigInt, circular refs, functions)
- host system access from sandbox

---

### 7. FAILURE HANDLING

Define strict rules:

- Docker failure = SYSTEM_ERROR (NO silent fallback)
- VM failure = RE
- undefined/null output = RE (not WA)
- any execution crash must be explicit and structured

---

### 8. FINAL OUTPUT REQUIRED

Return:

1. Complete architecture diagram (text-based is fine)
2. Execution flow per language
3. Security hardening summary
4. Scaling strategy (production-grade)
5. Remaining risks (honest assessment)
6. Recommended next evolution step (LeetCode-level upgrade path)

---

Make it deterministic, secure, and production-grade like a real Online Judge infrastructure system.