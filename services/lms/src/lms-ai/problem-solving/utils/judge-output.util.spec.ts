import { parseJudgeStdout, tryJsonCloneForJudge } from './judge-output.util';

describe('parseJudgeStdout', () => {
  it('parses single-line JSON', () => {
    expect(parseJudgeStdout('[0,1]\n')).toEqual([0, 1]);
  });

  it('uses last line when earlier lines are not JSON', () => {
    const stdout = 'debug\n{"ok":true}\n';
    expect(parseJudgeStdout(stdout)).toEqual({ ok: true });
  });

  it('throws on empty stdout', () => {
    expect(() => parseJudgeStdout('   ')).toThrow(/no JSON/);
  });
});

describe('tryJsonCloneForJudge', () => {
  it('clones plain data', () => {
    expect(tryJsonCloneForJudge({ a: 1 })).toEqual({ ok: true, value: { a: 1 } });
  });

  it('fails on circular structures', () => {
    const o: Record<string, unknown> = {};
    o.self = o;
    expect(tryJsonCloneForJudge(o).ok).toBe(false);
  });

  it('converts bigint to string', () => {
    const r = tryJsonCloneForJudge({ x: 1n });
    expect(r).toEqual({ ok: true, value: { x: '1' } });
  });

  it('fails on undefined in object', () => {
    expect(tryJsonCloneForJudge({ a: undefined }).ok).toBe(false);
  });
});
