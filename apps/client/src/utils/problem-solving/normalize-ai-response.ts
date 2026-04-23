const CODE_FENCE_REGEX = /```([a-zA-Z0-9+#-]*)\s*([\s\S]*?)```/g;
const MAX_UNWRAP_DEPTH = 6;

type SupportedLanguage = "typescript" | "javascript" | "python" | "java";

type CodeBlock = {
  languageLabel: string;
  code: string;
};

function unwrapNestedPayload(input: string, depth = 0): string {
  if (depth >= MAX_UNWRAP_DEPTH) return input.trim();
  const source = input.trim();
  if (!source) return "";

  try {
    const parsed = JSON.parse(source) as unknown;
    if (typeof parsed === "string") {
      return unwrapNestedPayload(parsed, depth + 1);
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === "string" && item.trim()) {
          return unwrapNestedPayload(item, depth + 1);
        }
        if (item && typeof item === "object") {
          const nested = unwrapNestedPayload(JSON.stringify(item), depth + 1);
          if (nested) return nested;
        }
      }
      return source;
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const priority = ["solution", "code", "response", "content", "data"];
      const ordered = [
        ...priority.map((key) => record[key]),
        ...Object.entries(record)
          .filter(([key]) => !priority.includes(key))
          .map(([, value]) => value),
      ];
      for (const value of ordered) {
        if (typeof value === "string" && value.trim()) {
          return unwrapNestedPayload(value, depth + 1);
        }
        if (value && typeof value === "object") {
          const nested = unwrapNestedPayload(JSON.stringify(value), depth + 1);
          if (nested) return nested;
        }
      }
    }
  } catch {
    // Non-JSON payload.
  }

  return source;
}

function stripNoise(input: string): string {
  return input
    .replace(/solution unlocked/gi, "")
    .replace(/^\s*(here('|’)s|here is)\s+(the\s+)?(solution|code)\s*:?\s*$/gim, "")
    .replace(/^\s*(explanation|notes?)\s*:.*$/gim, "")
    .trim();
}

function extractCodeBlocks(input: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  for (const match of input.matchAll(CODE_FENCE_REGEX)) {
    const languageLabel = (match[1] ?? "").toLowerCase();
    const code = (match[2] ?? "").trim();
    if (code) blocks.push({ languageLabel, code });
  }
  return blocks;
}

function looksExecutable(code: string): boolean {
  const text = code.trim();
  if (!text) return false;
  const markers = [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /=>\s*\{/,
    /class\s+\w+/,
    /def\s+\w+\s*\(/,
    /import\s+\w+/,
    /public\s+class\s+\w+/,
    /return\s+/,
  ];
  return markers.some((marker) => marker.test(text));
}

function mapFenceLabelToLanguage(label: string): SupportedLanguage | null {
  const normalized = label.toLowerCase();
  if (["ts", "tsx", "typescript"].includes(normalized)) return "typescript";
  if (["js", "jsx", "javascript"].includes(normalized)) return "javascript";
  if (["py", "python"].includes(normalized)) return "python";
  if (["java"].includes(normalized)) return "java";
  return null;
}

function fallbackCleanRaw(input: string): string {
  return input
    .replace(/```[a-zA-Z0-9+#-]*/g, "")
    .replace(/```/g, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^solution unlocked$/i.test(trimmed)) return false;
      if (/^(explanation|notes?)\s*:/i.test(trimmed)) return false;
      if (/^[*-]\s/.test(trimmed) && !/[;{}()[\]=]/.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

export function normalizeAIResponse(input: string): string {
  const unwrapped = unwrapNestedPayload(String(input ?? ""));
  const cleaned = stripNoise(unwrapped);
  const blocks = extractCodeBlocks(cleaned);

  if (blocks.length > 0) {
    const best = [...blocks].sort((a, b) => {
      const aScore = looksExecutable(a.code) ? a.code.length + 10_000 : a.code.length;
      const bScore = looksExecutable(b.code) ? b.code.length + 10_000 : b.code.length;
      return bScore - aScore;
    })[0];
    return stripNoise(best?.code ?? "").trim();
  }

  return fallbackCleanRaw(cleaned);
}

export function detectLanguageFromNormalizedCode(
  rawInput: string,
  normalizedCode: string,
): SupportedLanguage | null {
  const blocks = extractCodeBlocks(rawInput);
  if (blocks.length > 0) {
    const best = [...blocks].sort((a, b) => b.code.length - a.code.length)[0];
    const fromFence = mapFenceLabelToLanguage(best?.languageLabel ?? "");
    if (fromFence) return fromFence;
  }

  const code = normalizedCode.trim();
  if (!code) return null;
  if (/^\s*def\s+\w+\s*\(/m.test(code) || /print\(/.test(code)) return "python";
  if (/public\s+class\s+\w+/.test(code) || /System\.out\.println/.test(code)) return "java";
  if (/: \w+/.test(code) || /interface\s+\w+/.test(code)) return "typescript";
  if (/function\s+\w+\s*\(/.test(code) || /const\s+\w+\s*=/.test(code)) return "javascript";
  return null;
}
