type JsonLike = Record<string, unknown> | unknown[];

const CODE_FENCE_REGEX = /```([a-zA-Z0-9+#-]*)\s*([\s\S]*?)```/g;
const MAX_UNWRAP_DEPTH = 6;

function isJsonLike(value: unknown): value is JsonLike {
  return typeof value === 'object' && value !== null;
}

function asMeaningfulString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractFromKnownKeys(value: Record<string, unknown>): unknown[] {
  const preferredKeys = ['solution', 'code', 'response', 'content', 'data'];
  const found: unknown[] = [];
  for (const key of preferredKeys) {
    if (key in value) {
      found.push(value[key]);
    }
  }
  for (const [key, nested] of Object.entries(value)) {
    if (!preferredKeys.includes(key)) {
      found.push(nested);
    }
  }
  return found;
}

function unwrapNestedPayload(input: string, depth = 0): string {
  if (depth >= MAX_UNWRAP_DEPTH) return input.trim();
  const source = input.trim();
  if (!source) return '';

  try {
    const parsed = JSON.parse(source) as unknown;
    if (typeof parsed === 'string') {
      return unwrapNestedPayload(parsed, depth + 1);
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const text = asMeaningfulString(item);
        if (text) return unwrapNestedPayload(text, depth + 1);
        if (isJsonLike(item)) {
          const maybe = unwrapNestedPayload(JSON.stringify(item), depth + 1);
          if (maybe) return maybe;
        }
      }
      return source;
    }
    if (isJsonLike(parsed)) {
      const candidates = extractFromKnownKeys(parsed as Record<string, unknown>);
      for (const candidate of candidates) {
        const text = asMeaningfulString(candidate);
        if (text) return unwrapNestedPayload(text, depth + 1);
        if (isJsonLike(candidate)) {
          const maybe = unwrapNestedPayload(
            JSON.stringify(candidate),
            depth + 1,
          );
          if (maybe) return maybe;
        }
      }
    }
  } catch {
    // Non-JSON content, handled downstream.
  }

  return source;
}

function stripKnownNoise(input: string): string {
  return input
    .replace(/solution unlocked/gi, '')
    .replace(/^\s*(here('|’)s|here is)\s+(the\s+)?(solution|code)\s*:?\s*$/gim, '')
    .replace(/^\s*(explanation|notes?)\s*:.*$/gim, '')
    .trim();
}

function looksExecutable(code: string): boolean {
  const text = code.trim();
  if (!text) return false;
  const signals = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /=>\s*\{/,
    /class\s+\w+/,
    /def\s+\w+\s*\(/,
    /if\s+__name__\s*==\s*['"]__main__['"]/,
    /#include\s*</,
    /int\s+main\s*\(/,
    /std::/,
    /return\s+/,
  ];
  return signals.some((signal) => signal.test(text));
}

function getLongestCodeBlock(input: string): string | null {
  const blocks: string[] = [];
  for (const match of input.matchAll(CODE_FENCE_REGEX)) {
    const body = (match[2] ?? '').trim();
    if (body) {
      blocks.push(body);
    }
  }
  if (!blocks.length) return null;

  blocks.sort((a, b) => {
    const aScore = looksExecutable(a) ? a.length + 10_000 : a.length;
    const bScore = looksExecutable(b) ? b.length + 10_000 : b.length;
    return bScore - aScore;
  });

  return blocks[0] ?? null;
}

function cleanupFallbackRaw(input: string): string {
  const noFenceTokens = input
    .replace(/```[a-zA-Z0-9+#-]*/g, '')
    .replace(/```/g, '')
    .trim();

  const candidateLines = noFenceTokens
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^solution unlocked$/i.test(trimmed)) return false;
      if (/^(explanation|notes?)\s*:/i.test(trimmed)) return false;
      if (/^[*-]\s/.test(trimmed) && !/[;{}()[\]=]/.test(trimmed)) return false;
      return true;
    });

  const candidate = candidateLines.join('\n').trim();
  return candidate;
}

export function normalizeAIResponse(input: string): string {
  const unwrapped = unwrapNestedPayload(String(input ?? ''));
  const cleaned = stripKnownNoise(unwrapped);

  const bestBlock = getLongestCodeBlock(cleaned);
  if (bestBlock) {
    return stripKnownNoise(bestBlock).trim();
  }

  return cleanupFallbackRaw(cleaned).trim();
}
