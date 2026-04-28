"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CourseSidebar } from "@/components/student/lms/courses/course-sidebar";
import { getCourseSidebarData, CourseSidebarDataType } from "@/components/student/lms/courses/data/get-course-sidebar-data";

interface iAppProps {
  children: ReactNode;
}

export default function CourseLayout({ children }: iAppProps) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [courseData, setCourseData] = useState<CourseSidebarDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (slug) {
        const data = await getCourseSidebarData(slug);
        setCourseData(data);
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading || !courseData) {
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
      {/* sidebar - 30% */}
      <div className="w-80 border-r border-border shrink-0">
        <CourseSidebar course={courseData.course}/>
      </div>

      {/* main Content - 70% */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
