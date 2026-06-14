"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

type ArticleMarkdownProps = {
  markdown: string;
  className?: string;
};

function ArticleCode({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");
  const isBlock = Boolean(match);

  if (!isBlock) {
    return (
      <code
        className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] before:content-none after:content-none"
        {...props}
      >
        {children}
      </code>
    );
  }

  const lang = match?.[1] ?? "text";
  const lines = codeString.split("\n").length;

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <span className="font-mono">{lang}</span>
        {lines > 1 ? <span>{lines} lines</span> : null}
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: "1rem 1.1rem",
          fontSize: "0.875rem",
          lineHeight: 1.55,
          background: "transparent",
        }}
        showLineNumbers={lines > 4}
        wrapLongLines
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

const markdownComponents: Partial<Components> = {
  /** Fenced code: unwrap default <pre> so we render a single styled panel. */
  pre: ({ children }) => <div className="not-prose my-5">{children}</div>,
  code: ArticleCode,
};

/**
 * Renders Markdown (GFM) with typography tuned for long-form community articles.
 */
export function ArticleMarkdown({ markdown, className }: ArticleMarkdownProps) {
  if (!markdown?.trim()) return null;
  return (
    <div
      className={cn(
        "prose prose-lg prose-neutral max-w-none dark:prose-invert",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        "prose-a:font-medium prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-violet-400",
        "prose-code:rounded-md prose-code:bg-transparent prose-code:px-0 prose-code:py-0 prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none",
        "prose-blockquote:border-l-violet-500 prose-blockquote:text-muted-foreground",
        "prose-li:marker:text-violet-500",
        "prose-hr:border-border",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** Strip common Markdown for one-line previews (cards, meta). */
export function plainTextFromMarkdown(md: string, maxLen = 180): string {
  const t = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[#>*_\-~`|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length <= maxLen ? t : `${t.slice(0, maxLen - 1)}…`;
}
