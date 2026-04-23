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
