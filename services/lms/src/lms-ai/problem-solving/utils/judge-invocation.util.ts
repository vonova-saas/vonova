/**
 * Normalizes problem test `input` into positional arguments for the student's function.
 *
 * Supported shapes (JSON from DB / API):
 * - Array → spread as-is, e.g. `[[2,7,11,15], 9]` → `fn(nums, target)`.
 * - Plain object → values in **sorted key order**, e.g. `{ nums: [...], target: 9 }`
 *   → `fn(...[numsVal, targetVal])` so order is stable regardless of key insertion order.
 * - Primitive → single-arg `[value]`.
 */
export function isPlainJudgeInputObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * @param arity `fn.length` from the submitted function (required parameters only).
 *  - Plain object + `arity <= 1` → single argument `[raw]` (e.g. `solve({ a, b })`).
 *  - Plain object + `arity >= 2` and `Object.keys(raw).length === arity` → positional
 *    args in sorted key order (e.g. `{ nums, target }` for `twoSum(nums, target)`).
 *  - Otherwise fall back to `[raw]` for ambiguous shapes.
 */
export function normalizeJudgeInvocationArgsWithArity(
  raw: unknown,
  arity: number,
): unknown[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (isPlainJudgeInputObject(raw)) {
    if (arity <= 1) {
      return [raw];
    }
    const keys = Object.keys(raw).sort();
    if (keys.length === arity) {
      return keys.map((k) => raw[k]);
    }
    return [raw];
  }
  return [raw];
}

/**
 * Back-compat helper when arity is unknown: arrays and primitives behave as before;
 * plain objects are expanded to sorted values (LeetCode-style multi-arg JSON).
 */
export function normalizeJudgeInvocationArgs(raw: unknown): unknown[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (isPlainJudgeInputObject(raw)) {
    return Object.keys(raw)
      .sort()
      .map((k) => raw[k]);
  }
  return [raw];
}
