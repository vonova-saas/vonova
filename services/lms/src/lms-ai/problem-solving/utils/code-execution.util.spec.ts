import {
  CodeExecutionError,
  executeUserFunction,
} from './code-execution.util';

describe('executeUserFunction', () => {
  it('runs with single object arg (caller-built invocation)', async () => {
    const result = await executeUserFunction({
      code: 'function solve(input){ return input.a + input.b; }',
      functionName: 'solve',
      invocationArgs: [{ a: 2, b: 3 }],
      language: 'javascript',
    });
    expect(result).toBe(5);
  });

  it('runs twoSum with positional invocationArgs', async () => {
    const result = await executeUserFunction({
      code: 'function twoSum(nums, target){ return [0,1]; }',
      functionName: 'twoSum',
      invocationArgs: [[2, 7], 9],
      language: 'javascript',
    });
    expect(result).toEqual([0, 1]);
  });

  it('runs twoSum hash map with pre-built args from object mapping', async () => {
    const result = await executeUserFunction({
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
      invocationArgs: [[2, 7, 11, 15], 9],
      language: 'javascript',
    });
    expect(result).toEqual([0, 1]);
  });

  it('throws when function returns undefined', async () => {
    await expect(
      executeUserFunction({
        code: 'function twoSum(){ }',
        functionName: 'twoSum',
        invocationArgs: [[1], 1],
        language: 'javascript',
      }),
    ).rejects.toThrow(/undefined or null/);
  });

  it('throws CodeExecutionError when function missing', async () => {
    await expect(
      executeUserFunction({
        code: 'const x = 1;',
        functionName: 'solve',
        invocationArgs: [1],
        language: 'javascript',
      }),
    ).rejects.toThrow(CodeExecutionError);
  });

  it('throws for unsupported language', async () => {
    await expect(
      executeUserFunction({
        code: 'print(1)',
        functionName: 'solve',
        invocationArgs: [1],
        language: 'python',
      }),
    ).rejects.toThrow('not supported');
  });
});
