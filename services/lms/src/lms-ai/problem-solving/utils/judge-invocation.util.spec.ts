import { buildJudgeInvocationArgs } from './judge-invocation.util';

describe('buildJudgeInvocationArgs', () => {
  const two = ['nums', 'target'] as const;

  it('rejects empty parameterNames', () => {
    const r = buildJudgeInvocationArgs([1, 2], []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/non-empty/);
  });

  it('rejects unsafe parameter names', () => {
    const r = buildJudgeInvocationArgs({ nums: [1], target: 2 }, [
      'nums',
      '__proto__',
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Invalid parameter name/);
  });

  it('rejects dunder parameter names', () => {
    const r = buildJudgeInvocationArgs({ a: 1 }, ['__x']);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Invalid parameter name/);
  });

  it('maps object fields in parameter order', () => {
    expect(
      buildJudgeInvocationArgs(
        { nums: [2, 7, 11, 15], target: 9 },
        [...two],
      ),
    ).toEqual({ ok: true, args: [[2, 7, 11, 15], 9] });
    expect(
      buildJudgeInvocationArgs({ target: 6, nums: [3, 2, 4] }, [...two]),
    ).toEqual({ ok: true, args: [[3, 2, 4], 6] });
  });

  it('accepts array when length matches parameterNames', () => {
    expect(buildJudgeInvocationArgs([[1, 2], 3], [...two])).toEqual({
      ok: true,
      args: [[1, 2], 3],
    });
  });

  it('fails when array length mismatches', () => {
    const r = buildJudgeInvocationArgs([[1]], [...two]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/length/);
  });

  it('fails when object misses a field', () => {
    const r = buildJudgeInvocationArgs({ nums: [1] }, [...two]);
    expect(r.ok).toBe(false);
  });

  it('single primitive with one parameter name', () => {
    expect(buildJudgeInvocationArgs(42, ['n'])).toEqual({
      ok: true,
      args: [42],
    });
  });
});
