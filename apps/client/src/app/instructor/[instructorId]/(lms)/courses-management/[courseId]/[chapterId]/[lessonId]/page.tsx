import { adminGetLesson } from "@/components/instructor/lms/courses-management/data/admin-get-lesson";
import LessonForm from "@/components/instructor/lms/courses-management/lessons/lesson-form";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export default async function LessonIdPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  const lesson = await adminGetLesson(lessonId);

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}
