import { normalizeAIResponse } from './normalize-ai-response.util';

describe('normalizeAIResponse', () => {
  it('extracts code from markdown block', () => {
    const input = '```ts\nfunction sum(a,b){ return a+b; }\n```';
    expect(normalizeAIResponse(input)).toBe('function sum(a,b){ return a+b; }');
  });

  it('extracts code from nested JSON wrappers', () => {
    const input = JSON.stringify({
      response: JSON.stringify({
        solution: '```python\ndef solve(x):\n    return x * 2\n```',
      }),
    });
    expect(normalizeAIResponse(input)).toBe('def solve(x):\n    return x * 2');
  });

  it('handles mixed explanation and code', () => {
    const input = `Solution Unlocked
Here is your solution:
\`\`\`js
const answer = (n) => n + 1;
\`\`\`
Explanation: this is O(1).`;
    expect(normalizeAIResponse(input)).toBe('const answer = (n) => n + 1;');
  });

  it('chooses the longest valid code block', () => {
    const input = `\`\`\`js
return 1;
\`\`\`
text
\`\`\`js
function solve(nums){ const map = new Map(); return map; }
\`\`\``;
    expect(normalizeAIResponse(input)).toBe(
      'function solve(nums){ const map = new Map(); return map; }',
    );
  });

  it('returns empty string for empty response', () => {
    expect(normalizeAIResponse('')).toBe('');
  });

  it('falls back to raw cleaned string for invalid format', () => {
    const input = 'Solution Unlocked\nconst x = 1;';
    expect(normalizeAIResponse(input)).toBe('const x = 1;');
  });
});
