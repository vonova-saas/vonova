"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useCourseManagementStore } from "@/lib/stores";
import { toast } from "sonner";

interface DeleteLessonProps {
  chapterId: string;
  courseId: string;
  lessonId: string;
}

export function DeleteLesson({ chapterId, courseId, lessonId }: DeleteLessonProps) {
  const [open, setOpen] = useState(false);
  const { deleteLesson, actionLoading, error } = useCourseManagementStore();

  async function onSubmit() {
    const result = await deleteLesson(courseId, chapterId, lessonId);
    
    if (result) {
      toast.success("Lesson deleted successfully");
      setOpen(false);
    } else if (error) {
      toast.error(error);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are You absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            this action cannot be undone. This will permanently delete the
            lesson.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button onClick={onSubmit} disabled={actionLoading}>
            {actionLoading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
