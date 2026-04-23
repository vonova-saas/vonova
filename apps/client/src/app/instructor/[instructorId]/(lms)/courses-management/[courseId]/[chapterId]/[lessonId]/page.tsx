"use client";

import { useLesson } from "@/hooks/instructor/use-lesson";
import LessonForm from "@/components/instructor/lms/courses-management/lessons/lesson-form";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LessonIdPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const chapterId = params.chapterId as string;
  const lessonId = params.lessonId as string;

  const { data: lesson, isLoading, error } = useLesson(courseId, chapterId, lessonId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    toast.error("Failed to load lesson");
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load lesson. Please try again.</p>
      </div>
    );
  }

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}
