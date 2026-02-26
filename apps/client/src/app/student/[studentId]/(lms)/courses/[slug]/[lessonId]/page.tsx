import { getLessonContent } from "@/components/student/lms/courses/data/get-lesson-content";
import { CourseContent } from "@/components/student/lms/courses/course-content";
import { Suspense } from "react";
import { LessonSkeleton } from "@/components/student/lms/courses/lessons/lesson-skeleton";

type Params = Promise<{ lessonId: string }>;

export default async function LessonContentPage({
  params,
}: {
  params: Params;
}) {
  const { lessonId } = await params;

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader lessonId={lessonId} />
    </Suspense>
  );
}

async function LessonContentLoader({ lessonId }: { lessonId: string }) {
  const data = await getLessonContent(lessonId);

  return <CourseContent data={data} />;
}
