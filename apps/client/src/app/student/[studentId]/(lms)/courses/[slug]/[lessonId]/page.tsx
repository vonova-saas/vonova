"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getCourseBySlugQueryFn,
  getLessonContentQueryFn,
} from "@/services/student/lms/courses/courses.api";
import {
  mapApiLessonContentToPageData,
  type LessonContentType,
} from "@/components/student/lms/courses/data/get-lesson-content";
import { CourseContent } from "@/components/student/lms/courses/course-content";
import { LessonSkeleton } from "@/components/student/lms/courses/lessons/lesson-skeleton";
import { toast } from "sonner";

export default function LessonContentPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const slug = params.slug;
  const lessonId = params.lessonId;
  const [data, setData] = useState<LessonContentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!slug || !lessonId) return;
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const course = await getCourseBySlugQueryFn(slug);
        const courseId = course._id;
        const raw = await getLessonContentQueryFn(courseId, lessonId);
        if (cancelled) return;

        const lesson = raw.lesson;
        const video = lesson?.video ?? null;
        if (process.env.NODE_ENV === "development") {
          console.log("STREAM URL:", lesson?.video?.streamUrl);
          console.log("LESSON API RESPONSE:", {
            lesson,
            video,
            hasStream: !!(video?.streamUrl && String(video.streamUrl).trim()),
            hasObjectKey: !!(video?.videoObjectKey && String(video.videoObjectKey).trim()),
          });
        }

        setData(mapApiLessonContentToPageData(raw, courseId, slug));
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        const msg =
          e instanceof Error ? e.message : "Could not load this lesson.";
        setError(msg);
        setData(null);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, reloadKey]);

  if (loading) {
    return <LessonSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-destructive">
        {error ?? "Lesson not available."}
      </div>
    );
  }

  return (
    <CourseContent
      key={`${data.courseId}-${data.id}-${reloadKey}`}
      data={data}
      onRetryLessonContent={() => setReloadKey((k) => k + 1)}
      onAfterMarkComplete={() => setReloadKey((k) => k + 1)}
    />
  );
}
