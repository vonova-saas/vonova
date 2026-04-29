"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getLessonContent } from "@/components/student/lms/courses/data/get-lesson-content";
import type { LessonContentType } from "@/components/student/lms/courses/data/get-lesson-content";
import { CourseContent } from "@/components/student/lms/courses/course-content";
import { LessonSkeleton } from "@/components/student/lms/courses/lessons/lesson-skeleton";

export default function LessonContentPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;
  const [data, setData] = useState<LessonContentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (lessonId) {
        console.log("[LessonPage] Fetching lesson content for:", lessonId);
        const lessonData = await getLessonContent(lessonId);
        console.log("[LessonPage] Lesson data received:", lessonData);
        setData(lessonData);
        setLoading(false);
      }
    }
    fetchData();
  }, [lessonId]);

  if (loading || !data) {
    return <LessonSkeleton />;
  }

  return <CourseContent data={data} />;
}
