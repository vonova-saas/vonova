"use client";

import { ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CourseSidebar } from "@/components/student/lms/courses/course-sidebar";
import { useCourseSidebarData } from "@/hooks/student/lms/use-courses";

interface iAppProps {
  children: ReactNode;
}

export default function CourseLayout({ children }: iAppProps) {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const courseIdHint = searchParams.get("cid");

  const { data: courseData, isLoading } = useCourseSidebarData(
    slug ?? "",
    courseIdHint,
  );

  if (isLoading || !courseData?.course) {
    return (
      <div className="flex flex-1">
        <div className="w-80 border-r border-border shrink-0 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={courseData.course} />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
