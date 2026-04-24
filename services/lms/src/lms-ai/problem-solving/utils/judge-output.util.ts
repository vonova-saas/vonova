/**
 * Judge-side output handling: JSON-safe values, missing returns, stdout parsing.
 */

export function isMissingJudgeReturnValue(value: unknown): boolean {
  return value === undefined || value === null;
}

/**
 * Parse container stdout into a single JSON value. Tolerates trailing debug lines by
 * trying the last non-empty line if full-string parse fails.
 */
export function parseJudgeStdout(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('Program produced no JSON output on stdout');
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      try {
        return JSON.parse(lines[i].trim()) as unknown;
      } catch {
        /* continue */
      }
    }
    throw new Error('stdout is not valid JSON');
  }
}

const ZW_AND_BIDI = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2060-\u2064]/;

function isPlainJsonObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Walk a value into JSON-only data (no Date/Map/BigInt/circular/undefined holes).
 * Throws with a stable message when the tree is not judge-serializable.
 */
export function sanitizeJudgeJsonTree(value: unknown): unknown {
  /** Only objects/arrays on the current recursion branch (shared acyclic subgraphs allowed). */
  const visiting = new Set<object>();

  const inner = (value: unknown, path: string): unknown => {
    if (value === undefined) {
      throw new Error(`${path}: undefined is not allowed in judge JSON values`);
    }
    if (value === null) return null;
    const t = typeof value;
    if (t === 'string') {
      if (ZW_AND_BIDI.test(value as string)) {
        throw new Error(
          `${path}: strings containing zero-width or bidi control characters are rejected`,
        );
      }
      return value;
    }
    if (t === 'boolean') return value;
    if (t === 'number') {
      if (!Number.isFinite(value as number)) {
        throw new Error(
          `${path}: non-finite numbers (NaN / Infinity) are not JSON-serializable`,
        );
      }
      return value;
    }
    if (t === 'bigint') {
      return (value as bigint).toString();
    }
    if (t === 'function' || t === 'symbol') {
      throw new Error(`${path}: type "${t}" is not JSON-serializable`);
    }
    if (value instanceof Date) {
      return (value as Date).toISOString();
    }
    if (value instanceof Map || value instanceof Set) {
      throw new Error(`${path}: Map and Set are not JSON-serializable for judge output`);
    }
    if (Array.isArray(value)) {
      if (visiting.has(value)) {
        throw new Error(`${path}: circular structure is not JSON-serializable`);
      }
      visiting.add(value);
      try {
        return value.map((item, i) => inner(item, `${path}[${i}]`));
      } finally {
        visiting.delete(value);
      }
    }
    if (isPlainJsonObject(value)) {
      if (visiting.has(value)) {
        throw new Error(`${path}: circular structure is not JSON-serializable`);
      }
      visiting.add(value);
      try {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value)) {
          if (ZW_AND_BIDI.test(key)) {
            throw new Error(
              `${path}: object keys containing zero-width or bidi control characters are rejected`,
            );
          }
          if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
          const v = value[key];
          if (v === undefined) {
            throw new Error(
              `${path}: undefined value for property "${key}" is not JSON-serializable`,
            );
          }
          out[key] = inner(v, `${path}.${key}`);
        }
        return out;
      } finally {
        visiting.delete(value);
      }
    }
    throw new Error(
      `${path}: unsupported type for judge JSON: ${Object.prototype.toString.call(value)}`,
    );
  };

  return inner(value, '$');
}

/** Deep clone via structured walk + JSON round-trip for stable compare. */
export function jsonCloneForJudge(value: unknown): unknown {
  const sanitized = sanitizeJudgeJsonTree(value);
  return JSON.parse(JSON.stringify(sanitized)) as unknown;
}

/** Non-throwing clone for judge rows (expected / output) — RE if not JSON-safe. */
export function tryJsonCloneForJudge(
  value: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: jsonCloneForJudge(value) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error:
        msg ||
        'Expected or actual value is not JSON-serializable (e.g. circular structure)',
    };
  }
}
