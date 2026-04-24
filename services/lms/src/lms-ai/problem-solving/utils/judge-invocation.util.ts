/**
 * Deterministic invocation: map each test `input` to positional args using
 * `problem.parameterNames` order only (no fn.length / inspect heuristics).
 */

const UNSAFE_PARAM_NAMES = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

const CONFUSABLE_CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\ufeff]/;

/**
 * Rejects prototype-pollution vectors, Unicode / zero-width tricks, and any
 * character outside a strict ASCII identifier (same rule as `functionName` in harnesses).
 */
export function isSafeJudgeParameterName(name: string): boolean {
  if (name.length === 0 || name.length > 128) {
    return false;
  }
  if (CONFUSABLE_CTRL.test(name)) {
    return false;
  }
  let norm: string;
  try {
    norm = name.normalize('NFKC');
  } catch {
    return false;
  }
  if (norm !== name) {
    return false;
  }
  if (name.startsWith('__')) {
    return false;
  }
  if (UNSAFE_PARAM_NAMES.has(name)) {
    return false;
  }
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

export function isPlainJudgeInputObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

export type BuildInvocationResult =
  | { ok: true; args: unknown[] }
  | { ok: false; error: string };

/**
 * @param parameterNames Non-empty ordered names from the problem document (required).
 */
export function buildJudgeInvocationArgs(
  raw: unknown,
  parameterNames: string[],
): BuildInvocationResult {
  if (raw === undefined || raw === null) {
    return { ok: false, error: 'Test case input is null or undefined' };
  }

  const names = parameterNames.map((n) => String(n).trim()).filter(Boolean);
  if (names.length === 0) {
    return {
      ok: false,
      error:
        'problem.parameterNames must be a non-empty array of parameter identifiers',
    };
  }

  for (const name of names) {
    if (!isSafeJudgeParameterName(name)) {
      return {
        ok: false,
        error: `Invalid parameter name "${name}" (must be a simple identifier; unsafe names are rejected)`,
      };
    }
  }

  if (Array.isArray(raw)) {
    if (raw.length !== names.length) {
      return {
        ok: false,
        error: `Test input array length ${raw.length} does not match problem.parameterNames length ${names.length}`,
      };
    }
    return { ok: true, args: [...raw] };
  }

  if (isPlainJudgeInputObject(raw)) {
    for (const name of names) {
      if (!Object.prototype.hasOwnProperty.call(raw, name)) {
        return {
          ok: false,
          error: `Test input object is missing required field "${name}" (problem.parameterNames)`,
        };
      }
    }
    return { ok: true, args: names.map((n) => raw[n]) };
  }

  if (names.length === 1) {
    return { ok: true, args: [raw] };
  }

  return {
    ok: false,
    error:
      'Test input must be a JSON array or plain object whose fields match problem.parameterNames',
  };
}
