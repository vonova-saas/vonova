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

/** Deep clone via JSON; drops functions/symbols/BigInt edge cases for stable compare. */
export function jsonCloneForJudge(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
  ) as unknown;
}
