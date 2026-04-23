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

interface DeleteChapterProps {
  chapterId: string;
  courseId: string;
}

export function DeleteChapter({ chapterId, courseId }: DeleteChapterProps) {
  const [open, setOpen] = useState(false);
  const { deleteChapter, actionLoading, error } = useCourseManagementStore();

  async function onSubmit() {
    const result = await deleteChapter(courseId, chapterId);
    
    if (result) {
      toast.success("Chapter deleted successfully");
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
            Chapter.
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
