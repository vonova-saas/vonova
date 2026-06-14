"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInstructorProblemSheetMutation } from "@/hooks/instructor/use-problem-solving-management";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  VisibilityField,
  type VisibilityChoice,
} from "./resource-primitives";

type InlineCreateSheetFormProps = {
  courseId: string;
  chapterId: string;
  lessonId: string;
  onCancel: () => void;
  onCreated: (created: { id: string; title: string }) => void;
};

export function InlineCreateSheetForm({
  courseId,
  chapterId,
  lessonId,
  onCancel,
  onCreated,
}: InlineCreateSheetFormProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateInstructorProblemSheetMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [tags, setTags] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState<VisibilityChoice>("PRIVATE");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        tags: parsedTags,
        courseId,
        chapterId,
        lessonId,
        visibility: visibility.toLowerCase() as "private" | "public",
        estimatedDuration: estimatedDuration ? Number(estimatedDuration) : null,
        timerMinutes: timerMinutes ? Number(timerMinutes) : null,
        dueDate: dueDate || null,
      };

      const res = await createMutation.mutateAsync(payload);
      const id = res._id;
      if (!id) throw new Error("Server did not return a sheet id");
      
      toast.success("Problem sheet created and attached");
      
      // Invalidate queries to refresh list
      void queryClient.invalidateQueries({
        queryKey: ["instructor-problem-solving", "sheets"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["lesson-resources", lessonId],
      });

      onCreated({ id, title: title.trim() });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to create problem sheet";
      toast.error(msg);
    }
  }

  const saving = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="inline-sheet-title">
            Title
          </label>
          <Input
            id="inline-sheet-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Recursion Practice Sheet"
            required
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="inline-sheet-description">
            Description
          </label>
          <Textarea
            id="inline-sheet-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description for students"
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="inline-sheet-difficulty">
            Difficulty
          </label>
          <select
            id="inline-sheet-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="inline-sheet-tags">
            Tags (comma separated)
          </label>
          <Input
            id="inline-sheet-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. recursion, algorithms"
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="inline-sheet-duration">
            Est. Duration (minutes)
          </label>
          <Input
            id="inline-sheet-duration"
            type="number"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="e.g. 45"
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="inline-sheet-timer">
            Timer Limit (minutes, optional)
          </label>
          <Input
            id="inline-sheet-timer"
            type="number"
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(e.target.value)}
            placeholder="e.g. 60"
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="inline-sheet-due-date">
            Due Date (optional)
          </label>
          <Input
            id="inline-sheet-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <VisibilityField
        value={visibility}
        onChange={setVisibility}
        resourceLabel="problem sheet"
        managementLabel="Problem Solving Management library"
        disabled={saving}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create & Attach Sheet"
          )}
        </Button>
      </div>
    </form>
  );
}
