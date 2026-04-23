import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

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
  return language.trim().toLowerCase();
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
  }>((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
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
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });
  });
}

export async function runInDocker(params: {
  code: string;
  language: string;
  functionName: string;
  input: unknown;
  timeLimitMs: number;
  memoryLimitMb: number;
}): Promise<RunResult> {
  const {
    code,
    language,
    functionName,
    input,
    timeLimitMs,
    memoryLimitMb,
  } = params;
  const normalizedLanguage = normalizeLanguage(language);
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

  const tempDir = join(process.cwd(), '.judge-tmp', randomUUID());
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
