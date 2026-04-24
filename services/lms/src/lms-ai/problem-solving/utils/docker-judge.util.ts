import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CodeExecutionError, executeUserFunction } from './code-execution.util';
import { isSafeJudgeParameterName } from './judge-invocation.util';
import {
  isMissingJudgeReturnValue,
  jsonCloneForJudge,
  parseJudgeStdout,
} from './judge-output.util';

/** Fixed LMS harness: Gson + reflection (default package `Solution` only). */
const JAVA_MAIN_HARNESS = `import com.google.gson.*;
import java.lang.reflect.*;
import java.nio.file.*;

public class Main {
  public static void main(String[] args) throws Exception {
    String raw = Files.readString(Path.of("/workspace/payload.json"));
    JsonObject root = JsonParser.parseString(raw).getAsJsonObject();
    String functionName = root.get("functionName").getAsString();
    JsonArray invocationArgs = root.getAsJsonArray("invocationArgs");
    Class<?> solClass = Class.forName("Solution");
    Object sol = solClass.getDeclaredConstructor().newInstance();
    Method target = null;
    for (Method m : solClass.getDeclaredMethods()) {
      if (!m.getName().equals(functionName)) continue;
      int mods = m.getModifiers();
      if (java.lang.reflect.Modifier.isStatic(mods)) continue;
      if (m.getParameterCount() != invocationArgs.size()) continue;
      if (target != null) {
        throw new IllegalStateException("Ambiguous overload for " + functionName);
      }
      target = m;
    }
    if (target == null) {
      throw new IllegalStateException(
          "Instance method not found: " + functionName + " with arity " + invocationArgs.size());
    }
    target.setAccessible(true);
    Gson gson = new Gson();
    Class<?>[] ptypes = target.getParameterTypes();
    Object[] nargs = new Object[ptypes.length];
    for (int i = 0; i < ptypes.length; i++) {
      nargs[i] = gson.fromJson(invocationArgs.get(i), ptypes[i]);
    }
    Object out = target.invoke(sol, nargs);
    System.out.print(gson.toJson(out));
  }
}
`;

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

/** Languages that must use Docker — never run their source through the JS VM. */
const DOCKER_ONLY_LANGUAGES = new Set([
  'python',
  'py',
  'cpp',
  'c++',
  'java',
]);

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
    return 'g++ -O2 -std=c++17 -I/workspace /workspace/main.cpp -o /workspace/main && /workspace/main';
  }
  if (language === 'java') {
    return 'javac -cp /workspace/gson-2.10.1.jar /workspace/Main.java /workspace/Solution.java && java -cp /workspace:/workspace/gson-2.10.1.jar Main';
  }
  return 'node /workspace/runner.js';
}

function buildCppHarness(userCode: string, functionName: string): string {
  return `#include "json.hpp"
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

using json = nlohmann::json;

/*
 * C++ ABI: define exactly one free function named like the problem, taking the full
 * invocationArgs JSON array and returning JSON (nlohmann::json), e.g.:
 *   json twoSum(const json& invocationArgs) {
 *     auto nums = invocationArgs[0].get<std::vector<int>>();
 *     int target = invocationArgs[1].get<int>();
 *     return json(std::vector<int>{0, 1});
 *   }
 */
// ----- user submission -----
${userCode}
// ----- end user submission -----

static json read_payload() {
  std::ifstream in("/workspace/payload.json");
  if (!in) throw std::runtime_error("cannot open payload.json");
  json j;
  in >> j;
  return j;
}

int main() {
  try {
    json p = read_payload();
    std::string fname = p.at("functionName").get<std::string>();
    const std::string expected = ${JSON.stringify(functionName)};
    if (fname != expected) {
      throw std::runtime_error(std::string("functionName mismatch: ") + fname);
    }
    json args = p.at("invocationArgs");
    json out = ${functionName}(args);
    std::cout << out.dump() << std::endl;
    return 0;
  } catch (const std::exception& e) {
    std::cerr << e.what() << std::endl;
    return 1;
  }
}
`;
}

function buildJudgeSourceFiles(
  language: string,
  code: string,
  functionName: string,
): Array<{ name: string; content: string }> {
  if (language === 'python' || language === 'py') {
    return [
      {
        name: 'runner.py',
        content: `${code}

import json

with open('/workspace/payload.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)

fn_name = payload.get('functionName')
args = payload.get('invocationArgs')
if not isinstance(args, list):
    raise RuntimeError('Invalid judge payload: invocationArgs must be a JSON array')
fn = globals().get(fn_name)
if not callable(fn):
    raise Exception(f'Function "{fn_name}" not found')

result = fn(*args)
print(json.dumps(result))
`,
      },
    ];
  }
  if (language === 'cpp' || language === 'c++') {
    return [{ name: 'main.cpp', content: buildCppHarness(code, functionName) }];
  }
  if (language === 'java') {
    return [
      { name: 'Solution.java', content: code },
      { name: 'Main.java', content: JAVA_MAIN_HARNESS },
    ];
  }
  return [
    {
      name: 'runner.js',
      content: `${code}
const fs = require('fs');
const payload = JSON.parse(fs.readFileSync('/workspace/payload.json', 'utf8'));
const fnName = payload.functionName;
const args = payload.invocationArgs;
if (!Array.isArray(args)) {
  throw new Error('Invalid judge payload: invocationArgs must be an array');
}
const fn = globalThis[fnName];
if (typeof fn !== 'function') {
  throw new Error(\`Function "\${fnName}" not found\`);
}
const out = fn.apply(null, args);
if (typeof out?.then === 'function') {
  throw new Error('Async return values are not supported');
}
process.stdout.write(JSON.stringify(out));
`,
    },
  ];
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

/** Declared language only — no source-based inference (fair, deterministic). */
function vmLanguageForNoDocker(declared: string): string {
  if (DOCKER_ONLY_LANGUAGES.has(declared)) {
    return declared;
  }
  if (isVmRunnableLanguage(declared)) {
    return declared === 'js' || declared === 'node' || declared === 'nodejs'
      ? 'javascript'
      : declared === 'ts'
        ? 'typescript'
        : declared;
  }
  return declared;
}

async function runWithVm(params: {
  code: string;
  functionName: string;
  invocationArgs: unknown[];
  language: string;
  timeLimitMs: number;
}): Promise<RunResult> {
  const startedAt = Date.now();
  try {
    const output = await executeUserFunction({
      code: params.code,
      functionName: params.functionName,
      invocationArgs: params.invocationArgs,
      language: params.language,
      timeoutMs: params.timeLimitMs,
    });
    if (isMissingJudgeReturnValue(output)) {
      return {
        status: 'runtime_error',
        error:
          'Submission produced no return value (undefined/null). Ensure every path returns the answer.',
        executionTime: Date.now() - startedAt,
        memoryUsed: 0,
        stdout: '',
        stderr: '',
      };
    }
    return {
      status: 'accepted',
      output: jsonCloneForJudge(output),
      executionTime: Date.now() - startedAt,
      memoryUsed: 0,
      stdout: '',
      stderr: '',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isTimeout =
      message.includes('Script execution timed out') ||
      message.includes('timed out') ||
      message.includes('worker terminated');
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

async function copyVendorIntoWorkspace(
  tempDir: string,
  normalizedLanguage: string,
): Promise<void> {
  if (normalizedLanguage === 'cpp' || normalizedLanguage === 'c++') {
    const src = join(__dirname, '../vendor/nlohmann/json.hpp');
    await fs.copyFile(src, join(tempDir, 'json.hpp'));
    return;
  }
  if (normalizedLanguage === 'java') {
    const gson = join(__dirname, '../vendor/gson-2.10.1.jar');
    await fs.copyFile(gson, join(tempDir, 'gson-2.10.1.jar'));
  }
}

export async function runInDocker(params: {
  code: string;
  language: string;
  functionName: string;
  invocationArgs: unknown[];
  timeLimitMs: number;
  memoryLimitMb: number;
}): Promise<RunResult> {
  const { code, language, functionName, invocationArgs, timeLimitMs, memoryLimitMb } =
    params;
  const normalizedLanguage = normalizeLanguage(language);
  const useDocker = await isDockerCliAvailable();
  const vmLanguage = vmLanguageForNoDocker(normalizedLanguage);

  if (!useDocker) {
    if (isVmRunnableLanguage(vmLanguage)) {
      return runWithVm({
        code,
        functionName,
        invocationArgs,
        language: vmLanguage,
        timeLimitMs,
      });
    }
    const langHint = DOCKER_ONLY_LANGUAGES.has(vmLanguage)
      ? ` Your language is set to "${language}"; without Docker that cannot run on this host. Either switch the language menu to JavaScript (or TypeScript) to match your code, or deploy LMS with Docker.`
      : '';
    return {
      status: 'runtime_error',
      error:
        'Docker is not available in this deployment. Only JavaScript/TypeScript can be judged here. For Python/C++/Java, run LMS with Docker (e.g. mount /var/run/docker.sock) or set JUDGE_USE_DOCKER=false and use JS/TS only.' +
        langHint,
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

  const needsHarnessIdent =
    normalizedLanguage === 'cpp' ||
    normalizedLanguage === 'c++' ||
    normalizedLanguage === 'java';
  if (needsHarnessIdent && !isSafeJudgeParameterName(functionName)) {
    return {
      status: 'runtime_error',
      error: `Invalid functionName for ${normalizedLanguage} harness (must be a safe ASCII identifier).`,
      executionTime: 0,
      memoryUsed: 0,
      stdout: '',
      stderr: '',
    };
  }

  const tempDir = join(judgeTempRoot(), randomUUID());
  await fs.mkdir(tempDir, { recursive: true });
  try {
    await copyVendorIntoWorkspace(tempDir, normalizedLanguage);
    const sources = buildJudgeSourceFiles(normalizedLanguage, code, functionName);
    for (const s of sources) {
      await fs.writeFile(join(tempDir, s.name), s.content, 'utf8');
    }
    await fs.writeFile(
      join(tempDir, 'payload.json'),
      JSON.stringify({ functionName, invocationArgs }),
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
      return {
        status: 'runtime_error',
        error: `[JUDGE_DOCKER_SYSTEM_ERROR] Docker failed while spawning the judge container: ${result.spawnError}. No execution fallback is performed — repair Docker (daemon running, socket mounted) or use JS/TS-only mode with JUDGE_USE_DOCKER=false.`,
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

    let parsed: unknown;
    try {
      parsed = parseJudgeStdout(result.stdout);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'runtime_error',
        executionTime: elapsed,
        memoryUsed,
        error: msg,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
    if (isMissingJudgeReturnValue(parsed)) {
      return {
        status: 'runtime_error',
        executionTime: elapsed,
        memoryUsed,
        error:
          'Solution printed null/undefined or invalid JSON to stdout. Return a JSON-serializable value only.',
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
    return {
      status: 'accepted',
      executionTime: elapsed,
      memoryUsed,
      output: jsonCloneForJudge(parsed),
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
