import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CodeExecutionError, executeUserFunction } from './code-execution.util';

/** Writable temp root for judge bind-mounts. Do not use process.cwd() — /app is often read-only in Docker. */
function judgeTempRoot(): string {
  const fromEnv = process.env.JUDGE_TMP_DIR?.trim();
  if (fromEnv) return fromEnv;
  return join(tmpdir(), 'vonova-judge');
}

export type JudgeStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded';

type RunResult = {
  output?: unknown;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  stdout: string;
  stderr: string;
  status: JudgeStatus;
};

const LANGUAGE_IMAGES: Record<string, string> = {
  javascript: 'node:20-alpine',
  js: 'node:20-alpine',
  typescript: 'node:20-alpine',
  ts: 'node:20-alpine',
  python: 'python:3.12-alpine',
  py: 'python:3.12-alpine',
  cpp: 'gcc:14',
  'c++': 'gcc:14',
  java: 'openjdk:21-jdk-slim',
};

function normalizeLanguage(language: string): string {
  return String(language ?? '')
    .trim()
    .toLowerCase();
}

function createRunnerScript(language: string): string {
  if (language === 'python' || language === 'py') {
    return 'python /workspace/runner.py';
  }
  if (language === 'cpp' || language === 'c++') {
    return 'g++ -O2 -std=c++17 /workspace/main.cpp -o /workspace/main && /workspace/main';
  }
  if (language === 'java') {
    return 'javac /workspace/Main.java && java -cp /workspace Main';
  }
  return 'node /workspace/runner.js';
}

function buildSourceFile(
  language: string,
  code: string,
): { name: string; content: string } {
  if (language === 'python' || language === 'py') {
    return {
      name: 'runner.py',
      content: `${code}

import json

with open('/workspace/payload.json', 'r', encoding='utf-8') as f:
  payload = json.load(f)

fn_name = payload.get('functionName')
raw_input = payload.get('input')
args = raw_input if isinstance(raw_input, list) else [raw_input]
fn = globals().get(fn_name)
if not callable(fn):
  raise Exception(f'Function "{fn_name}" not found')

result = fn(*args)
print(json.dumps(result))
`,
    };
  }
  if (language === 'cpp' || language === 'c++') {
    return {
      name: 'main.cpp',
      content: code,
    };
  }
  if (language === 'java') {
    return {
      name: 'Main.java',
      content: code,
    };
  }
  return {
    name: 'runner.js',
    content: `${code}
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('/workspace/payload.json', 'utf8'));
const fnName = payload.functionName;
const rawInput = payload.input;
const args = Array.isArray(rawInput) ? rawInput : [rawInput];
const fn = globalThis[fnName];
if (typeof fn !== 'function') {
  throw new Error(\`Function "\${fnName}" not found\`);
}
const out = fn(...args);
if (typeof out?.then === 'function') {
  throw new Error('Async return values are not supported');
}
process.stdout.write(JSON.stringify(out));
`,
  };
}

async function execCommand(command: string, args: string[], timeoutMs: number) {
  return new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    spawnError?: string;
  }>((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    const finish = (payload: {
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
      spawnError?: string;
    }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (err) => {
      finish({
        stdout,
        stderr,
        exitCode: null,
        timedOut: false,
        spawnError: err.message,
      });
    });
    child.on('close', (code) => {
      finish({ stdout, stderr, exitCode: code, timedOut });
    });
  });
}

/** Cached: is `docker` CLI usable (Railway LMS image often has no Docker). */
let dockerCliAvailable: boolean | undefined;

async function isDockerCliAvailable(): Promise<boolean> {
  if (dockerCliAvailable !== undefined) return dockerCliAvailable;
  if (process.env.JUDGE_USE_DOCKER === 'false') {
    dockerCliAvailable = false;
    return false;
  }
  const probe = await execCommand(
    'docker',
    ['version', '--format', '{{.Client.Version}}'],
    4000,
  );
  if (probe.spawnError || probe.exitCode !== 0) {
    dockerCliAvailable = false;
    return false;
  }
  dockerCliAvailable = true;
  return true;
}

function isVmRunnableLanguage(normalized: string): boolean {
  return (
    normalized === 'javascript' ||
    normalized === 'js' ||
    normalized === 'node' ||
    normalized === 'nodejs' ||
    normalized === 'typescript' ||
    normalized === 'ts'
  );
}

/**
 * Without Docker, only the Node VM runner is available. Students sometimes leave
 * "Python" selected while pasting JS — infer JS/TS from source when safe.
 */
function vmLanguageForNoDocker(params: {
  declared: string;
  code: string;
  functionName: string;
}): string {
  const { declared, code, functionName } = params;
  if (isVmRunnableLanguage(declared)) {
    return declared === 'js' || declared === 'node' || declared === 'nodejs'
      ? 'javascript'
      : declared === 'ts'
        ? 'typescript'
        : declared;
  }

  const fn = functionName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasProblemFunction =
    fn.length > 0 && new RegExp(`function\\s+${fn}\\s*\\(`, 'm').test(code);
  const looksLikeJs =
    hasProblemFunction ||
    /\bfunction\s+\w+\s*\(/.test(code) ||
    /\b(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(code) ||
    (/\b=>\s*\{/.test(code) && /\breturn\b/.test(code));

  const looksLikePy =
    /^\s*def\s+\w+\s*\(/m.test(code) ||
    /if\s+__name__\s*==\s*['"]__main__['"]/m.test(code);
  const looksLikeJava =
    /\bpublic\s+(?:static\s+)?(?:void|int|boolean|double|String)\s+\w+\s*\(/m.test(
      code,
    );
  const looksLikeCpp =
    /#include\s*[</]/m.test(code) ||
    /\b(int|void|bool|auto)\s+\w+\s*\([^)]*\)\s*\{/.test(code);

  if (looksLikeJs && !looksLikePy && !looksLikeJava && !looksLikeCpp) {
    return declared === 'typescript' || declared === 'ts'
      ? 'typescript'
      : 'javascript';
  }

  return declared;
}

function runWithVm(params: {
  code: string;
  functionName: string;
  input: unknown;
  language: string;
  timeLimitMs: number;
}): RunResult {
  const startedAt = Date.now();
  try {
    const output = executeUserFunction({
      code: params.code,
      functionName: params.functionName,
      input: params.input,
      language: params.language,
      timeoutMs: params.timeLimitMs,
    });
    return {
      status: 'accepted',
      output,
      executionTime: Date.now() - startedAt,
      memoryUsed: 0,
      stdout: '',
      stderr: '',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout =
      message.includes('Script execution timed out') ||
      message.includes('timed out');
    if (isTimeout) {
      return {
        status: 'time_limit_exceeded',
        error: message,
        executionTime: Date.now() - startedAt,
        memoryUsed: 0,
        stdout: '',
        stderr: '',
      };
    }
    const isCodeExec = error instanceof CodeExecutionError;
    return {
      status: 'runtime_error',
      error: message,
      executionTime: Date.now() - startedAt,
      memoryUsed: 0,
      stdout: '',
      stderr: isCodeExec ? message : '',
    };
  }
}

export async function runInDocker(params: {
  code: string;
  language: string;
  functionName: string;
  input: unknown;
  timeLimitMs: number;
  memoryLimitMb: number;
}): Promise<RunResult> {
  const { code, language, functionName, input, timeLimitMs, memoryLimitMb } =
    params;
  const normalizedLanguage = normalizeLanguage(language);
  const useDocker = await isDockerCliAvailable();
  const vmLanguage = vmLanguageForNoDocker({
    declared: normalizedLanguage,
    code,
    functionName,
  });

  if (!useDocker) {
    if (isVmRunnableLanguage(vmLanguage)) {
      return runWithVm({
        code,
        functionName,
        input,
        language: vmLanguage,
        timeLimitMs,
      });
    }
    return {
      status: 'runtime_error',
      error:
        'Docker is not available in this deployment. Only JavaScript/TypeScript can be judged here. For Python/C++/Java, run LMS with Docker (e.g. mount /var/run/docker.sock) or set JUDGE_USE_DOCKER=false and use JS/TS only.',
      executionTime: 0,
      memoryUsed: 0,
      stdout: '',
      stderr: '',
    };
  }

  const image = LANGUAGE_IMAGES[normalizedLanguage];
  if (!image) {
    return {
      status: 'runtime_error',
      error: `Unsupported language: ${language}`,
      executionTime: 0,
      memoryUsed: 0,
      stdout: '',
      stderr: '',
    };
  }

  const tempDir = join(judgeTempRoot(), randomUUID());
  await fs.mkdir(tempDir, { recursive: true });
  const source = buildSourceFile(normalizedLanguage, code);
  await fs.writeFile(join(tempDir, source.name), source.content, 'utf8');
  await fs.writeFile(
    join(tempDir, 'payload.json'),
    JSON.stringify({ functionName, input }),
    'utf8',
  );

  const runnerScript = createRunnerScript(normalizedLanguage);
  const dockerArgs = [
    'run',
    '--rm',
    '--network',
    'none',
    '--cpus',
    '0.5',
    '--memory',
    `${memoryLimitMb}m`,
    '-v',
    `${tempDir}:/workspace`,
    image,
    'sh',
    '-lc',
    runnerScript,
  ];

  try {
    const startedAt = Date.now();
    const result = await execCommand(
      'docker',
      dockerArgs,
      Math.max(timeLimitMs + 300, 600),
    );
    const elapsed = Date.now() - startedAt;
    const memoryUsed = 0;

    if (result.spawnError) {
      dockerCliAvailable = false;
      const fallbackVmLang = vmLanguageForNoDocker({
        declared: normalizedLanguage,
        code,
        functionName,
      });
      if (isVmRunnableLanguage(fallbackVmLang)) {
        return runWithVm({
          code,
          functionName,
          input,
          language: fallbackVmLang,
          timeLimitMs,
        });
      }
      return {
        status: 'runtime_error',
        error: `Docker failed: ${result.spawnError}`,
        executionTime: elapsed,
        memoryUsed,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }

    if (result.timedOut) {
      return {
        status: 'time_limit_exceeded',
        executionTime: elapsed,
        memoryUsed,
        error: 'Time limit exceeded',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
    const stdErrLower = result.stderr.toLowerCase();
    if (
      stdErrLower.includes('out of memory') ||
      stdErrLower.includes('killed') ||
      stdErrLower.includes('oom')
    ) {
      return {
        status: 'memory_limit_exceeded',
        executionTime: elapsed,
        memoryUsed,
        error: result.stderr || 'Memory limit exceeded',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
    if (result.exitCode !== 0) {
      return {
        status: 'runtime_error',
        executionTime: elapsed,
        memoryUsed,
        error: result.stderr || 'Runtime error',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }

    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(result.stdout || 'null');
    } catch {
      parsed = result.stdout.trim();
    }
    return {
      status: 'accepted',
      executionTime: elapsed,
      memoryUsed,
      output: parsed,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
