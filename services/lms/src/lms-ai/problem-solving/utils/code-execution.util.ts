import { Script, createContext } from 'vm';

const DEFAULT_TIMEOUT_MS = 1500;

export class CodeExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeExecutionError';
  }
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

export function executeUserFunction(params: {
  code: string;
  functionName: string;
  input: unknown;
  language: string;
  timeoutMs?: number;
}): unknown {
  const { code, functionName, input, language, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

  if (!isSupportedLanguage(language)) {
    throw new CodeExecutionError(
      `Language "${language}" is not supported by the secure runner`,
    );
  }

  const safeFunctionName = functionName.trim();
  if (!safeFunctionName) {
    throw new CodeExecutionError('Problem is missing functionName');
  }

  const sandbox = createContext({
    console: { log: () => undefined, error: () => undefined, warn: () => undefined },
    module: { exports: {} as Record<string, unknown> },
    exports: {} as Record<string, unknown>,
    __input: input,
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
      __result = Array.isArray(__input) ? __fn(...__input) : __fn(__input);
    `,
  );

  try {
    runner.runInContext(sandbox, { timeout: timeoutMs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CodeExecutionError(message);
  }

  const result = (sandbox as { __result?: unknown }).__result;
  if (result && typeof (result as { then?: unknown }).then === 'function') {
    throw new CodeExecutionError(
      'Async return values are not supported in this runner',
    );
  }
  if (typeof result === 'function' || typeof result === 'symbol') {
    throw new CodeExecutionError(
      `Invalid return type from function: ${typeof result}`,
    );
  }

  return result;
}
