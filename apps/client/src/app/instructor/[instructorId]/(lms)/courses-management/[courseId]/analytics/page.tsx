"use client";

import { useParams } from "next/navigation";
import useUserId from "@/hooks/user/use-user-id";
import { CourseAnalyticsDashboard } from "@/components/instructor/lms/courses-management/analytics/course-analytics-dashboard";

export default function CourseAnalyticsPage() {
  const params = useParams<{ courseId: string; instructorId: string }>();
  const userId = useUserId();
  const courseId = params.courseId;
  const instructorId = params.instructorId || userId;

  if (!courseId || !instructorId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Missing course or instructor context.
      </div>
    );
  }

  return (
    <CourseAnalyticsDashboard courseId={courseId} instructorId={instructorId} />
  );
}
