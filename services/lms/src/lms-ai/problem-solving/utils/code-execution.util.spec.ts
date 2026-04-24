import {
  CodeExecutionError,
  executeUserFunction,
} from './code-execution.util';

describe('executeUserFunction', () => {
  it('executes user function with object input', () => {
    const result = executeUserFunction({
      code: 'function solve(input){ return input.a + input.b; }',
      functionName: 'solve',
      input: { a: 2, b: 3 },
      language: 'javascript',
    });
    expect(result).toBe(5);
  });

  it('executes user function with array input as args', () => {
    const result = executeUserFunction({
      code: 'function twoSum(nums, target){ return [0,1]; }',
      functionName: 'twoSum',
      input: [[2, 7], 9],
      language: 'javascript',
    });
    expect(result).toEqual([0, 1]);
  });

  it('expands object input into positional args (sorted keys)', () => {
    const result = executeUserFunction({
      code: `function twoSum(nums, target) {
        const m = new Map();
        for (let i = 0; i < nums.length; i++) {
          const c = target - nums[i];
          if (m.has(c)) return [m.get(c), i];
          m.set(nums[i], i);
        }
        return [-1,-1];
      }`,
      functionName: 'twoSum',
      input: { nums: [2, 7, 11, 15], target: 9 },
      language: 'javascript',
    });
    expect(result).toEqual([0, 1]);
  });

  it('throws when function returns undefined', () => {
    expect(() =>
      executeUserFunction({
        code: 'function twoSum(){ }',
        functionName: 'twoSum',
        input: [[1], 1],
        language: 'javascript',
      }),
    ).toThrow(/undefined or null/);
  });

  it('throws when function does not exist', () => {
    expect(() =>
      executeUserFunction({
        code: 'const x = 1;',
        functionName: 'solve',
        input: 1,
        language: 'javascript',
      }),
    ).toThrow(CodeExecutionError);
  });

  it('throws for unsupported language', () => {
    expect(() =>
      executeUserFunction({
        code: 'print(1)',
        functionName: 'solve',
        input: 1,
        language: 'python',
      }),
    ).toThrow('not supported');
  });
});
