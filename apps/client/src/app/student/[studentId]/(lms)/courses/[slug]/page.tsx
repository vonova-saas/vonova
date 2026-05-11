"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCourseSidebarData } from "@/components/student/lms/courses/data/get-course-sidebar-data";
import { CourseEnrollButton } from "@/components/student/lms/courses/course-enroll-button";
import { useStudentCoursesStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { queryClient } from "@/providers/providers";
import {
  getCourseByIdQueryFn,
  getCourseBySlugQueryFn,
  getEnrollmentStatusQueryFn,
} from "@/services/student/lms/courses/real-courses.api";
import type { Course } from "@/types/api/lms/courses.type";

export default function CoursesSlugPage() {
  const params = useParams<{ slug: string; studentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug, studentId } = params;
  const courseIdHint = searchParams.get("cid")?.trim() ?? "";
  const loadById = /^[a-fA-F0-9]{24}$/.test(courseIdHint);
  const [loading, setLoading] = useState(true);
  const [courseApi, setCourseApi] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const { hydrateMyEnrollments } = useStudentCoursesStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [sidebar, course] = await Promise.all([
          getCourseSidebarData(slug, courseIdHint || null),
          loadById
            ? getCourseByIdQueryFn(courseIdHint).catch(() => null)
            : getCourseBySlugQueryFn(slug).catch(() => null),
        ]);
        if (cancelled) return;
        setCourseApi(course);
        if (!course?._id) {
          setEnrolled(false);
          return;
        }
        await hydrateMyEnrollments();
        const en = await getEnrollmentStatusQueryFn(course._id);
        const isEn =
          !!en &&
          (en.status === "ACTIVE" ||
            en.status === "COMPLETED");
        setEnrolled(isEn);

        const firstChapter = sidebar.course.chapter[0];
        const firstLesson = firstChapter?.lessons[0];
        const isPrivate = course.visibility === "PRIVATE";
        if (firstLesson && (isEn || !isPrivate)) {
          router.push(`/student/${studentId}/courses/${slug}/${firstLesson.id}`);
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, studentId, router, hydrateMyEnrollments, courseIdHint, loadById]);

  const thumb =
    courseApi?.thumbnailUrl?.trim() || "/images/Dashboard.png";
  const useAws = typeof thumb === "string" && thumb.includes("amazonaws.com");
  const showLock = courseApi?.visibility === "PRIVATE" && !enrolled;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="animate-pulse space-y-4 w-full max-w-lg">
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!courseApi) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Course not found</h2>
        <Button asChild variant="outline">
          <Link href={`/student/${studentId}/courses`}>Back to courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <Image
          key={thumb}
          src={thumb}
          alt={courseApi.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          unoptimized={useAws}
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{courseApi.title}</h1>
        {courseApi.smallDescription && (
          <p className="text-muted-foreground mb-4">{courseApi.smallDescription}</p>
        )}
        {showLock && (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-4">
            <Lock className="h-5 w-5 shrink-0" />
            <span>
              Enroll to access lessons and materials for this private course.
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <CourseEnrollButton
            courseId={courseApi._id}
            studentId={studentId}
            slug={slug}
            price={courseApi.price}
          />
          <Button
            variant="outline"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["course-details"] });
              void queryClient.invalidateQueries({ queryKey: ["course-content"] });
              void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
              router.refresh();
            }}
          >
            Refresh access
          </Button>
        </div>
      </div>
    </div>
  );
}
