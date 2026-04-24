import { parseJudgeStdout } from './judge-output.util';

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
