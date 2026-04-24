/**
 * One row from the judge after running a single test case.
 * Matches the OJ contract: never omit the object; use `error` for failures.
 */
export type JudgeCaseResult = {
  passed: boolean;
  output: unknown;
  expected: unknown;
  error: string | null;
  /** Original case input after JSON coercion (redact for hidden cases at API if needed). */
  input: unknown;
};
