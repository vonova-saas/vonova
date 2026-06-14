"use client";

import { useMemo } from "react";
import type { JSONContent } from "@tiptap/react";
import parse from "html-react-parser";
import { cn } from "@/lib/utils";
import { RnderDescription } from "./rich-text-editor/rnder-description";

function tryTipTapDoc(raw: string): JSONContent | null {
  const t = raw.trim();
  if (!t || t.startsWith("<")) return null;
  try {
    const j = JSON.parse(t) as unknown;
    if (
      j &&
      typeof j === "object" &&
      !Array.isArray(j) &&
      (j as JSONContent).type === "doc"
    ) {
      return j as JSONContent;
    }
  } catch {
    return null;
  }
  return null;
}

/** Plain preview for cards / meta (no raw JSON). */
export function plainTextFromCourseDescription(value?: string | null): string {
  const s = value?.trim();
  if (!s) return "";
  const doc = tryTipTapDoc(s);
  if (doc?.content && Array.isArray(doc.content)) {
    const lines = doc.content.map((node) => {
      const n = node as { content?: Array<{ text?: string }> };
      if (n.content && Array.isArray(n.content)) {
        return n.content.map((c) => c.text ?? "").join("");
      }
      return "";
    });
    return lines.filter(Boolean).join("\n").trim();
  }
  if (s.startsWith("<")) {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return s;
}

type Props = {
  description?: string | null;
  className?: string;
};

/**
 * LMS course long description: TipTap JSON string, HTML, or plain text.
 * Keeps rendering separate from community markdown.
 */
export function CourseDescriptionRich({ description, className }: Props) {
  const d = description?.trim();
  const doc = useMemo(() => (d ? tryTipTapDoc(d) : null), [d]);

  if (!d) return null;

  if (doc) {
    return (
      <div className={cn("max-w-none", className)}>
        <RnderDescription json={doc} />
      </div>
    );
  }

  if (d.startsWith("<")) {
    return (
      <div
        className={cn(
          "prose prose-lg max-w-none dark:prose-invert prose-li:marker:text-primary",
          className,
        )}
      >
        {parse(d)}
      </div>
    );
  }

  return (
    <p
      className={cn(
        "whitespace-pre-wrap text-muted-foreground leading-relaxed",
        className,
      )}
    >
      {d}
    </p>
  );
}
