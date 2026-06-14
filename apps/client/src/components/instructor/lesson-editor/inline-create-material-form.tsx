"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { lmsCourseCategories } from "@/lib/courses/zodSchema";
import { useAuthContext } from "@/context/app/auth/auth-context";
import {
  createLibraryBookMutationFn,
  uploadLibraryFileMutationFn,
} from "@/services/api/shared/material-library/material.api";
import { invalidateMaterialLibraryQueries } from "@/lib/lms/invalidate-lms-media-queries";
import type { CreateMaterialRequest } from "@/types/api/shared/material-library/material.type";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  VisibilityField,
  type VisibilityChoice,
} from "./resource-primitives";

type InlineCreateMaterialFormProps = {
  /** Course this lesson belongs to. Forwarded as `scope.courseId` for backend course-locking once shipped. */
  courseId: string;
  lessonId: string;
  onCancel: () => void;
  onCreated: (created: {
    id: string;
    title: string;
    viewType: "book" | "guide" | "presentation";
  }) => void;
};

type MaterialDraft = CreateMaterialRequest;

export function InlineCreateMaterialForm({
  courseId,
  lessonId,
  onCancel,
  onCreated,
}: InlineCreateMaterialFormProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const authorName = user?.name?.trim() || "Unknown Instructor";

  const [draft, setDraft] = useState<MaterialDraft>({
    title: "",
    description: "",
    type: "book",
    tags: [],
    category: "OTHER",
    level: "Beginner",
    isPublic: false,
    topicId: "",
    isPublished: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<VisibilityChoice>("PRIVATE");
  const [submitting, setSubmitting] = useState(false);

  const itemTypeFor = (
    t: MaterialDraft["type"],
  ): "book" | "presentation" | "guide" =>
    t === "presentation" ? "presentation" : t === "visual-guide" ? "guide" : "book";

  const viewTypeFor = (
    t: MaterialDraft["type"],
  ): "book" | "guide" | "presentation" =>
    t === "presentation" ? "presentation" : t === "visual-guide" ? "guide" : "book";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: MaterialDraft = {
        ...draft,
        title: draft.title.trim(),
        authors: [{ name: authorName }],
        topics: draft.topicId ? [draft.topicId] : [],
        visibility,
        isPublic: visibility === "PUBLIC",
        courseId,
        lessonId,
      };

      const created = await createLibraryBookMutationFn(payload);
      const id = created.material?._id || created.material?.id;
      if (!id) throw new Error("Server did not return a material id");

      if (file) {
        await uploadLibraryFileMutationFn(itemTypeFor(draft.type), id, file);
      }

      invalidateMaterialLibraryQueries(queryClient);

      onCreated({
        id,
        title: draft.title.trim(),
        viewType: viewTypeFor(draft.type),
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to create material";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="inline-mat-title">
          Title
        </label>
        <Input
          id="inline-mat-title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Material title"
          required
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="inline-mat-description"
        >
          Description (optional)
        </label>
        <textarea
          id="inline-mat-description"
          value={draft.description ?? ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder="Short description for students"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="inline-mat-type"
          >
            Type
          </label>
          <select
            id="inline-mat-type"
            value={draft.type}
            onChange={(e) =>
              setDraft({
                ...draft,
                type: e.target.value as MaterialDraft["type"],
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="book">Book / PDF</option>
            <option value="visual-guide">Visual guide</option>
            <option value="presentation">Presentation</option>
          </select>
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="inline-mat-level"
          >
            Level
          </label>
          <select
            id="inline-mat-level"
            value={draft.level || "Beginner"}
            onChange={(e) =>
              setDraft({
                ...draft,
                level: e.target.value as CreateMaterialRequest["level"],
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="inline-mat-category"
        >
          Category
        </label>
        <select
          id="inline-mat-category"
          value={draft.category || "OTHER"}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {lmsCourseCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="inline-mat-file">
          File (optional, can be added later)
        </label>
        <Input
          id="inline-mat-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <VisibilityField
        value={visibility}
        onChange={setVisibility}
        resourceLabel="material"
        managementLabel="Material Library"
        disabled={submitting}
      />

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
        <div>
          <label
            className="text-sm font-medium"
            htmlFor="inline-mat-published"
          >
            Publish to students
          </label>
          <p className="text-xs text-muted-foreground">
            Off = saved as draft; only you can see it.
          </p>
        </div>
        <Switch
          id="inline-mat-published"
          checked={draft.isPublished ?? true}
          onCheckedChange={(checked) =>
            setDraft({ ...draft, isPublished: checked })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create & attach"
          )}
        </Button>
      </div>
    </form>
  );
}
