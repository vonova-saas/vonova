import {
  normalizeJudgeInvocationArgs,
  normalizeJudgeInvocationArgsWithArity,
} from './judge-invocation.util';

describe('normalizeJudgeInvocationArgs', () => {
  it('spreads array inputs as positional args', () => {
    expect(normalizeJudgeInvocationArgs([[2, 7, 11, 15], 9])).toEqual([
      [2, 7, 11, 15],
      9,
    ]);
  });

  it('maps plain object to sorted key order (Two Sum shape)', () => {
    expect(
      normalizeJudgeInvocationArgs({ nums: [2, 7, 11, 15], target: 9 }),
    ).toEqual([[2, 7, 11, 15], 9]);
  });

  it('wraps primitives as single-arg', () => {
    expect(normalizeJudgeInvocationArgs(42)).toEqual([42]);
  });

  it('returns empty array for null/undefined', () => {
    expect(normalizeJudgeInvocationArgs(null)).toEqual([]);
    expect(normalizeJudgeInvocationArgs(undefined)).toEqual([]);
  });
});

describe('normalizeJudgeInvocationArgsWithArity', () => {
  const obj = { a: 2, b: 3 };

  it('passes single object when arity is 1', () => {
    expect(normalizeJudgeInvocationArgsWithArity(obj, 1)).toEqual([obj]);
  });

  it('spreads object when arity matches key count', () => {
    expect(
      normalizeJudgeInvocationArgsWithArity(
        { nums: [3, 2, 4], target: 6 },
        2,
      ),
    ).toEqual([[3, 2, 4], 6]);
  });
});
