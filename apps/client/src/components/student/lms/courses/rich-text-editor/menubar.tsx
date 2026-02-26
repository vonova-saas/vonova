
"use client"

import { type Editor } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading1Icon, Heading2Icon, Heading3Icon, Italic, ListIcon, ListOrderedIcon, Redo, Strikethrough, Undo } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenubarProps {
  editor: Editor | null;
}

export function Menubar({ editor }: MenubarProps) {
  if (!editor) return null;

  return (
    <div className="border border-input border-t-0 border-x-0 rounded-t-lg p2 bg-card flex flex-wrap items-center">
      <TooltipProvider>
        <div className=" flex flex-wrap gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBold().run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(
                  "p-1",
                  editor.isActive("bold") && "bg-muted text-foreground"
                )}
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() =>
                  editor.chain().focus().toggleItalic().run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(
                  "p-1",
                  editor.isActive("italic") && "bg-muted text-foreground"
                )}
              >
                <Italic />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              italic
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() =>
                  editor.chain().focus().toggleStrike().run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(
                  "p-1",
                  editor.isActive("strike") && "bg-muted text-foreground"
                )}
              >
                <Strikethrough />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              strike
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(

                  editor.isActive("heading", { level: 1 }) && "bg-muted text-foreground"
                )}
              >
                <Heading1Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              heading 1
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(

                  editor.isActive("heading", { level: 2 }) && "bg-muted text-foreground"
                )}
              >
                <Heading2Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              heading 2
            </TooltipContent>
          </Tooltip>


          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(

                  editor.isActive("heading", { level: 3 }) && "bg-muted text-foreground"
                )}
              >
                <Heading3Icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              heading 3
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(

                  editor.isActive("bulletList") && "bg-muted text-foreground"
                )}
              >
                <ListIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              bulletList
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("orderdList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
                // ✅ Correct JSX expression (not a string)
                className={cn(

                  editor.isActive("orderdList") && "bg-muted text-foreground"
                )}
              >
                <ListOrderedIcon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              orderdList
            </TooltipContent>
          </Tooltip>
          <div className="w-px h-6 bg-border mx-2"></div>
          <div className="flex flex-wrap gap-1">

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive({ textAlign: "left" })}
                  onPressedChange={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  // ✅ Correct JSX expression (not a string)
                  className={cn(

                    editor.isActive({ textAlign: "left" }) && "bg-muted text-foreground"
                  )}
                >
                  <AlignLeft />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                AlignLeft
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive({ textAlign: "center" })}
                  onPressedChange={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  // ✅ Correct JSX expression (not a string)
                  className={cn(

                    editor.isActive({ textAlign: "center" }) && "bg-muted text-foreground"
                  )}
                >
                  <AlignCenter />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                Aligncenter
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive({ textAlign: "right" })}
                  onPressedChange={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  // ✅ Correct JSX expression (not a string)
                  className={cn(

                    editor.isActive({ textAlign: "right" }) && "bg-muted text-foreground"
                  )}
                >
                  <AlignRight />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                Alignright
              </TooltipContent>
            </Tooltip>

          </div>
          <div className="w-px h-6 bg-border mx-2"></div>

          <div className="flex flex-wrap gap-1"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                <Undo />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              undo
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                <Redo />
              </Button>

            </TooltipTrigger>
            <TooltipContent>
              redo
            </TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>
    </div>
  );
}
