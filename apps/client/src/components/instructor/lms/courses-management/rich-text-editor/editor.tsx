"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Menubar } from "./menubar";

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
} as const;

/** Normalize API / form value into TipTap `content` (JSON doc, HTML string, or plain text). */
function parseContent(value: string | undefined): string | Record<string, unknown> {
  if (value == null || !String(value).trim()) {
    return { ...EMPTY_DOC };
  }
  const raw = String(value).trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      (parsed as { type?: string }).type === "doc"
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* not JSON */
  }
  if (!raw.startsWith("<")) {
    return `<p>${raw}</p>`;
  }
  return raw;
}

function contentSignature(value: string | undefined): string {
  if (value == null || !String(value).trim()) return "";
  return String(value).trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichTextEditor({ field }: { field: any }) {
  const lastExternal = useRef<string>(contentSignature(field.value));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-xl dark:prose-invert !w-full !max-w-none",
      },
    },

    onUpdate: ({ editor: ed }) => {
      field.onChange(JSON.stringify(ed.getJSON()));
      lastExternal.current = contentSignature(JSON.stringify(ed.getJSON()));
    },

    content: parseContent(field.value),
  });

  useEffect(() => {
    if (!editor) return;
    const sig = contentSignature(field.value);
    if (sig === lastExternal.current) return;
    lastExternal.current = sig;
    const next = parseContent(field.value);
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, field.value]);

  if (!editor) return null;

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
