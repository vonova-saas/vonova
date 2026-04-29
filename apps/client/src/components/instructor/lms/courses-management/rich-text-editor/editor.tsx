"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Menubar } from "./menubar";

// Helper to safely parse content
function parseContent(value: string | undefined) {
  if (!value) return "<p>Hello world</p>";

  try {
    // Try to parse as JSON (TipTap format)
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    // If not JSON, treat as HTML/plain text
    // Wrap plain text in paragraph tags
    if (!value.trim().startsWith("<")) {
      return `<p>${value}</p>`;
    }
    return value;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichTextEditor({ field }: { field: any }) {
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

    onUpdate: ({ editor }) => {
      field.onChange(JSON.stringify(editor.getJSON()));
    },

    content: parseContent(field.value),
  });

  if (!editor) return null;

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
