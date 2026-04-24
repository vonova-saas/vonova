import { existsSync } from 'fs';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { runVmJudgePayload, type VmJudgePayload } from './judge-vm-inner.util';

const DEFAULT_TIMEOUT_MS = 1500;
/** Wall-clock slack beyond vm.Script timeout for worker teardown. */
const WORKER_KILL_SLACK_MS = 400;

export class CodeExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeExecutionError';
  }
}

function judgeVmWorkerScriptPath(): string {
  return join(__dirname, 'judge-vm.worker.js');
}

/**
 * Worker isolation is on by default when `judge-vm.worker.js` sits next to this module
 * (Nest `dist` build). Under `ts-jest` the sibling `.js` is absent — execution falls back
 * to in-process `vm` unless `JUDGE_VM_USE_WORKER=true` (fail loud if misconfigured).
 */
function vmWorkerEnabled(): boolean {
  if (process.env.JUDGE_VM_USE_WORKER === 'false') {
    return false;
  }
  if (process.env.JUDGE_VM_USE_WORKER === 'true') {
    return true;
  }
  return existsSync(judgeVmWorkerScriptPath());
}

function isSupportedLanguage(language: string): boolean {
  const normalized = language.trim().toLowerCase();
  return (
    normalized === 'javascript' ||
    normalized === 'js' ||
    normalized === 'node' ||
    normalized === 'nodejs' ||
    normalized === 'typescript' ||
    normalized === 'ts'
  );
}

async function executeUserFunctionWorker(params: {
  code: string;
  functionName: string;
  invocationArgs: unknown[];
  language: string;
  timeoutMs: number;
}): Promise<unknown> {
  const workerPath = judgeVmWorkerScriptPath();
  if (!existsSync(workerPath)) {
    throw new CodeExecutionError(
      `JUDGE_VM_USE_WORKER=true but judge worker script is missing at ${workerPath}`,
    );
  }
  const payload: VmJudgePayload = {
    code: params.code,
    functionName: params.functionName,
    invocationArgs: params.invocationArgs,
    timeoutMs: params.timeoutMs,
    language: params.language,
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const settleReject = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    const settleResolve = (v: unknown) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };

    let worker: Worker;
    try {
      worker = new Worker(workerPath, { workerData: payload });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      settleReject(
        new CodeExecutionError(`Failed to start judge worker: ${msg}`),
      );
      return;
    }

    const killMs = params.timeoutMs + WORKER_KILL_SLACK_MS;
    const killTimer = setTimeout(() => {
      void worker
        .terminate()
        .catch(() => undefined)
        .finally(() => {
          settleReject(
            new CodeExecutionError(
              'Script execution timed out (worker terminated)',
            ),
          );
        });
    }, killMs);

    const cleanup = () => {
      clearTimeout(killTimer);
      void worker.terminate().catch(() => undefined);
    };

    worker.on('message', (msg: ReturnType<typeof runVmJudgePayload>) => {
      cleanup();
      if (msg.ok) {
        settleResolve(msg.result);
      } else {
        settleReject(new CodeExecutionError(msg.error));
      }
    });

    worker.on('error', (err) => {
      cleanup();
      settleReject(
        err instanceof Error ? err : new CodeExecutionError(String(err)),
      );
    });

    worker.on('exit', (code) => {
      if (settled) return;
      cleanup();
      if (code !== 0) {
        settleReject(
          new CodeExecutionError(
            `Judge worker exited unexpectedly (code ${code})`,
          ),
        );
      }
    });
  });
}

/**
 * Run user JS/TS with **pre-built positional args** (same contract as Docker runners).
 * Defaults to a **Worker Thread** so vm.Script CPU limits cannot freeze the LMS process.
 * `JUDGE_VM_USE_WORKER=false` forces in-process `vm` (dev/tests). `JUDGE_VM_USE_WORKER=true`
 * requires a compiled `judge-vm.worker.js` next to this file (fail loud if missing).
 */
export async function executeUserFunction(params: {
  code: string;
  functionName: string;
  invocationArgs: unknown[];
  language: string;
  timeoutMs?: number;
}): Promise<unknown> {
  const {
    code,
    functionName,
    invocationArgs,
    language,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = params;

  if (!isSupportedLanguage(language)) {
    throw new CodeExecutionError(
      `Language "${language}" is not supported by the secure runner`,
    );
  }

  const safeFunctionName = functionName.trim();
  if (!safeFunctionName) {
    throw new CodeExecutionError('Problem is missing functionName');
  }

  if (vmWorkerEnabled()) {
    return executeUserFunctionWorker({
      code,
      functionName: safeFunctionName,
      invocationArgs,
      language,
      timeoutMs,
    });
  }

  const r = runVmJudgePayload({
    code,
    functionName: safeFunctionName,
    invocationArgs,
    language,
    timeoutMs,
  });
  if (!r.ok) {
    throw new CodeExecutionError(r.error);
  }
  return r.result;
}
