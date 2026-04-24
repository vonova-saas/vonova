import { Script, createContext } from 'vm';
import {
  isMissingJudgeReturnValue,
  jsonCloneForJudge,
} from './judge-output.util';

export type VmJudgePayload = {
  code: string;
  functionName: string;
  invocationArgs: unknown[];
  timeoutMs: number;
  language: string;
};

export type VmJudgeResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

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

/**
 * Single VM execution (used in-process or inside a Worker Thread).
 * Return value is JSON-cloned for safe postMessage / compare.
 */
export function runVmJudgePayload(params: VmJudgePayload): VmJudgeResult {
  const { code, functionName, invocationArgs, timeoutMs, language } = params;

  if (!isSupportedLanguage(language)) {
    return {
      ok: false,
      error: `Language "${language}" is not supported by the secure runner`,
    };
  }

  const safeFunctionName = functionName.trim();
  if (!safeFunctionName) {
    return { ok: false, error: 'Problem is missing functionName' };
  }

  const sandbox = createContext({
    console: {
      log: () => undefined,
      error: () => undefined,
      warn: () => undefined,
    },
    module: { exports: {} as Record<string, unknown> },
    exports: {} as Record<string, unknown>,
    __args: invocationArgs,
    __result: undefined as unknown,
  });

  const runner = new Script(
    `
      "use strict";
      ${code}
      const __fnName = ${JSON.stringify(safeFunctionName)};
      const __fn =
        (typeof globalThis[__fnName] === "function" && globalThis[__fnName]) ||
        (module && module.exports && typeof module.exports[__fnName] === "function" && module.exports[__fnName]) ||
        (typeof exports[__fnName] === "function" && exports[__fnName]);
      if (typeof __fn !== "function") {
        throw new Error('Function "' + __fnName + '" was not found in submission');
      }
      __result = __fn.apply(null, __args);
    `,
  );

  try {
    runner.runInContext(sandbox, { timeout: timeoutMs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }

  const result = (sandbox as { __result?: unknown }).__result;
  if (result && typeof (result as { then?: unknown }).then === 'function') {
    return {
      ok: false,
      error: 'Async return values are not supported in this runner',
    };
  }
  if (typeof result === 'function' || typeof result === 'symbol') {
    return {
      ok: false,
      error: `Invalid return type from function: ${typeof result}`,
    };
  }

  if (isMissingJudgeReturnValue(result)) {
    return {
      ok: false,
      error:
        'Function must return a value (got undefined or null). Check all code paths return the expected answer.',
    };
  }

  try {
    return { ok: true, result: jsonCloneForJudge(result) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error:
        msg ||
        'Return value is not JSON-serializable (e.g. contains circular structure)',
    };
  }
}
