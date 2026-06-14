"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import {
  BarChart3,
  CalendarClock,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useInstructorCourses } from "@/hooks/instructor/use-courses";
import {
  instructorProblemSolvingKeys,
  useCreateInstructorProblemSheetMutationWithRedirect,
  useDeleteInstructorProblemSheetMutation,
  useDuplicateInstructorProblemSheetMutation,
  usePublishInstructorProblemSheetMutation,
  useUpdateInstructorProblemSheetMutation,
} from "@/hooks/instructor/use-problem-solving-management";
import { getInstructorCourseWithChaptersQueryFn } from "@/services/instructor/course-managment/courses.api";
import type {
  ProblemSheetEntity,
  UpsertProblemSheetRequest,
} from "@/services/instructor/lms/problem-solving/problem-solving.api";
import type { Chapter, Lesson } from "@/types/api/lms/courses.type";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type SheetFormState = {
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
  dueDate: string;
  visibility: "private" | "public";
  estimatedDuration: string;
  coverImage: string;
};

const NONE = "__none__";

const emptySheetForm: SheetFormState = {
  title: "",
  slug: "",
  description: "",
  difficulty: "medium",
  tags: "",
  courseId: "",
  chapterId: "",
  lessonId: "",
  dueDate: "",
  visibility: "private",
  estimatedDuration: "",
  coverImage: "",
};

function idsEqual(a?: string | null, b?: string | null) {
  return String(a ?? "") === String(b ?? "");
}

function displayDate(value?: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString();
}

function sheetToForm(sheet?: ProblemSheetEntity | null): SheetFormState {
  if (!sheet) return emptySheetForm;
  return {
    title: sheet.title ?? "",
    slug: sheet.slug ?? "",
    description: sheet.description ?? "",
    difficulty: sheet.difficulty ?? "medium",
    tags: sheet.tags?.join(", ") ?? "",
    courseId: sheet.courseId ?? "",
    chapterId: sheet.chapterId ?? "",
    lessonId: sheet.lessonId ?? "",
    dueDate: sheet.dueDate ? sheet.dueDate.slice(0, 10) : "",
    visibility: sheet.visibility ?? "private",
    estimatedDuration:
      sheet.estimatedDuration != null ? String(sheet.estimatedDuration) : "",
    coverImage: sheet.coverImage ?? "",
  };
}

function toPayload(form: SheetFormState): UpsertProblemSheetRequest {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || undefined,
    difficulty: form.difficulty,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    courseId: form.courseId || null,
    chapterId: form.chapterId || null,
    lessonId: form.lessonId || null,
    dueDate: form.dueDate || null,
    visibility: form.visibility,
    estimatedDuration: form.estimatedDuration
      ? Number(form.estimatedDuration)
      : null,
    coverImage: form.coverImage.trim() || undefined,
  };
}

function sheetQuestionCount(sheet: ProblemSheetEntity) {
  return sheet.totalQuestions ?? sheet.problems?.length ?? 0;
}

export function SheetManagementDashboard({
  sheets,
  instructorId,
}: {
  sheets: ProblemSheetEntity[];
  instructorId: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: courses = [] } = useInstructorCourses();
  const createSheet = useCreateInstructorProblemSheetMutationWithRedirect(instructorId);
  const updateSheet = useUpdateInstructorProblemSheetMutation();
  const duplicateSheet = useDuplicateInstructorProblemSheetMutation();
  const deleteSheet = useDeleteInstructorProblemSheetMutation();
  const publishSheet = usePublishInstructorProblemSheetMutation();

  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<ProblemSheetEntity | null>(null);
  const [form, setForm] = useState<SheetFormState>(emptySheetForm);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const selectedCourse = courses.find((course) => idsEqual(course._id, form.courseId));
  const { data: courseTree } = useQuery({
    queryKey: ["instructor-course-with-chapters", form.courseId],
    queryFn: () => getInstructorCourseWithChaptersQueryFn(form.courseId),
    enabled: Boolean(form.courseId),
  });
  const chapters = courseTree?.data.chapters ?? [];
  const selectedChapter = chapters.find((chapter) =>
    idsEqual(chapter._id, form.chapterId),
  );
  const lessons = selectedChapter?.lessons ?? [];

  const invalidateSheets = async () => {
    await queryClient.invalidateQueries({
      queryKey: instructorProblemSolvingKeys.sheets(),
    });
  };

  const stats = useMemo(
    () => ({
      all: sheets.length,
      draft: sheets.filter((sheet) => sheet.status === "draft").length,
      published: sheets.filter((sheet) => sheet.status === "published").length,
      attached: sheets.filter((sheet) => sheet.courseId || sheet.chapterId || sheet.lessonId).length,
    }),
    [sheets],
  );

  const filteredSheets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sheets.filter((sheet) => {
      if (activeTab === "drafts" && sheet.status !== "draft") return false;
      if (activeTab === "published" && sheet.status !== "published") return false;
      if (activeTab === "analytics") return true;
      if (!q) return true;
      return (
        sheet.title.toLowerCase().includes(q) ||
        (sheet.description ?? "").toLowerCase().includes(q) ||
        (sheet.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [activeTab, query, sheets]);

  const openCreate = () => {
    setEditingSheet(null);
    setForm(emptySheetForm);
    setIsSlugManuallyEdited(false);
    setEditorOpen(true);
  };

  const openEdit = (sheet: ProblemSheetEntity) => {
    setEditingSheet(sheet);
    setForm(sheetToForm(sheet));
    setIsSlugManuallyEdited(true);
    setEditorOpen(true);
  };

  const handleOpenSheet = (sheet: ProblemSheetEntity) => {
    const editorUrl = `/instructor/${instructorId}/problem-solving-management/sheets/${sheet._id}/editor`;
    try {
      router.push(editorUrl);
    } catch (error) {
      console.error("Failed to navigate to sheet editor:", error);
      // Fallback to window.location if router.push fails
      window.location.href = editorUrl;
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Sheet title is required.");
      return;
    }

    // Require at least one problem only for published sheets
    const isPublished = editingSheet?.status === "published";
    if (isPublished && editingSheet && sheetQuestionCount(editingSheet) === 0) {
      toast.error("Add at least one problem to the sheet.");
      return;
    }

    try {
      const payload = toPayload(form);
      if (editingSheet) {
        await updateSheet.mutateAsync({ sheetId: editingSheet._id, payload });
        toast.success("Sheet updated.");
        await invalidateSheets();
        setEditorOpen(false);
      } else {
        // For new sheets, the redirect mutation will handle navigation
        await createSheet.mutateAsync(payload);
        toast.success("Sheet saved as draft.");
        await invalidateSheets();
        // Don't close dialog - redirect will happen via mutation onSuccess
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const formattedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : typeof apiMessage === "string"
          ? apiMessage
          : "";
      toast.error(formattedMessage || "Could not save sheet.");
    }
  };

  const handlePublish = async (sheet: ProblemSheetEntity, publish: boolean) => {
    if (publish && sheetQuestionCount(sheet) === 0) {
      toast.error("Cannot publish an empty sheet. Add at least one problem first.");
      return;
    }
    try {
      await publishSheet.mutateAsync({ sheetId: sheet._id, publish });
      await invalidateSheets();
      toast.success(publish ? "Sheet published." : "Sheet moved to drafts.");
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const formattedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : typeof apiMessage === "string"
          ? apiMessage
          : "";
      toast.error(formattedMessage || "Could not update publish status.");
    }
  };

  const handleDuplicate = async (sheetId: string) => {
    try {
      await duplicateSheet.mutateAsync(sheetId);
      await invalidateSheets();
      toast.success("Sheet duplicated.");
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const formattedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : typeof apiMessage === "string"
          ? apiMessage
          : "";
      toast.error(formattedMessage || "Could not duplicate sheet.");
    }
  };

  const handleDelete = async (sheetId: string) => {
    try {
      await deleteSheet.mutateAsync(sheetId);
      await invalidateSheets();
      toast.success("Sheet deleted.");
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      const formattedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : typeof apiMessage === "string"
          ? apiMessage
          : "";
      toast.error(formattedMessage || "Could not delete sheet.");
    }
  };

  const attachedLabel = (sheet: ProblemSheetEntity) => {
    const course = courses.find((item) => idsEqual(item._id, sheet.courseId));
    if (!course) return "Unattached";
    const chapter = course.chapters?.find((item) => idsEqual(item._id, sheet.chapterId));
    const lesson = chapter?.lessons?.find((item) => idsEqual(item._id, sheet.lessonId));
    return [course.title, chapter?.title, lesson?.title].filter(Boolean).join(" / ");
  };

  return (
    <Card className="mb-8">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Problem Solving</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage sheets, attach them to course flow, and create problems in the sheet editor.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Sheet
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{stats.all}</p>
            <p className="text-xs text-muted-foreground">All sheets</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{stats.draft}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{stats.published}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-2xl font-semibold">{stats.attached}</p>
            <p className="text-xs text-muted-foreground">Attached</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="w-full overflow-x-auto md:w-fit">
              <TabsTrigger value="all">All Sheets</TabsTrigger>
              <TabsTrigger value="create" onClick={openCreate}>
                Create Sheet
              </TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sheets..."
              />
            </div>
          </div>

          {["all", "create", "drafts", "published", "analytics"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-5">
              {tab === "analytics" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredSheets.map((sheet) => (
                    <div key={sheet._id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{sheet.title}</p>
                        <Badge variant="outline">
                          {sheet.completionCount ?? 0} completions
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {sheetQuestionCount(sheet)} problems / {attachedLabel(sheet)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : filteredSheets.length === 0 ? (
                <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
                  No sheets found.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredSheets.map((sheet) => (
                    <div key={sheet._id} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold">{sheet.title}</h3>
                            <Badge variant={sheet.status === "published" ? "default" : "secondary"}>
                              {sheet.status}
                            </Badge>
                            <Badge variant="outline">{sheet.difficulty ?? "medium"}</Badge>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {sheet.description || "No description."}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(sheet)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenSheet(sheet)}>
                              <Eye className="h-4 w-4" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleDuplicate(sheet._id)}>
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => void handlePublish(sheet, sheet.status !== "published")}
                            >
                              <CalendarClock className="h-4 w-4" />
                              {sheet.status === "published" ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => void handleDelete(sheet._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(sheet.tags ?? []).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <p>{sheetQuestionCount(sheet)} problems</p>
                        <p>{sheet.completionCount ?? 0} completions</p>
                        <p>{attachedLabel(sheet)}</p>
                        <p>{displayDate(sheet.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingSheet ? "Edit sheet" : "Create sheet"}</DialogTitle>
            <DialogDescription>
              Attach the sheet to a course, chapter, or lesson. Problems are created inside the sheet editor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => {
                      const newTitle = event.target.value;
                      setForm((prev) => {
                        const updated = { ...prev, title: newTitle };
                        if (!isSlugManuallyEdited) {
                          updated.slug = slugify(newTitle, { lower: true, strict: true });
                        }
                        return updated;
                      });
                    }}
                    placeholder="Arrays fundamentals"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(event) => {
                      const rawSlug = event.target.value;
                      const sanitizedSlug = rawSlug
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-_]/g, "");
                      setIsSlugManuallyEdited(true);
                      setForm((prev) => ({ ...prev, slug: sanitizedSlug }));
                    }}
                    placeholder="arrays-fundamentals"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Difficulty</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(value: SheetFormState["difficulty"]) =>
                      setForm((prev) => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Visibility</Label>
                  <Select
                    value={form.visibility}
                    onValueChange={(value: SheetFormState["visibility"]) =>
                      setForm((prev) => ({ ...prev, visibility: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Estimated duration</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.estimatedDuration}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        estimatedDuration: event.target.value,
                      }))
                    }
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Select
                    value={form.courseId || NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        courseId: value === NONE ? "" : value,
                        chapterId: "",
                        lessonId: "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Unattached</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Chapter</Label>
                  <Select
                    disabled={!selectedCourse}
                    value={form.chapterId || NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        chapterId: value === NONE ? "" : value,
                        lessonId: "",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No chapter</SelectItem>
                      {chapters.map((chapter: Chapter) => (
                        <SelectItem key={chapter._id} value={chapter._id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Lesson</Label>
                  <Select
                    disabled={!selectedChapter}
                    value={form.lessonId || NONE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        lessonId: value === NONE ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No lesson</SelectItem>
                      {lessons.map((lesson: Lesson) => (
                        <SelectItem key={lesson._id} value={lesson._id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder="arrays, week-1, practice"
                />
              </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={createSheet.isPending || updateSheet.isPending}
            >
              {editingSheet ? "Save changes" : "Save draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
