import { compareOutputs } from './output-compare.util';

describe('compareOutputs', () => {
  it('strict compares primitives', () => {
    expect(compareOutputs(10, 10)).toBe(true);
    expect(compareOutputs(10, '10')).toBe(false);
  });

  it('deep compares objects', () => {
    expect(compareOutputs({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(
      true,
    );
  });

  it('compares arrays ordered by default', () => {
    expect(compareOutputs([0, 1], [1, 0])).toBe(false);
  });

  it('compares arrays as unordered when enabled', () => {
    expect(compareOutputs([0, 1], [1, 0], { ignoreArrayOrder: true })).toBe(
      true,
    );
  });

  it('handles unordered arrays with duplicates', () => {
    expect(compareOutputs([1, 1, 2], [1, 2, 1], { ignoreArrayOrder: true })).toBe(
      true,
    );
    expect(compareOutputs([1, 1, 2], [1, 2, 2], { ignoreArrayOrder: true })).toBe(
      false,
    );
  });
});
