"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCourseSidebarData } from "@/components/student/lms/courses/data/get-course-sidebar-data";
import { CourseEnrollButton } from "@/components/student/lms/courses/course-enroll-button";
import { useStudentCoursesStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";
import { queryClient } from "@/providers/providers";
import {
  getCourseByIdQueryFn,
  getCourseBySlugQueryFn,
  getEnrollmentStatusQueryFn,
} from "@/services/student/lms/courses/real-courses.api";
import type { Course } from "@/types/api/lms/courses.type";
import { CourseDescriptionRich, plainTextFromCourseDescription } from "@/components/student/lms/courses/course-description-rich";
import { shouldBypassNextImageOptimization, COURSE_THUMBNAIL_PLACEHOLDER } from "@/lib/lms/course-thumbnail";
import { useCourseThumbnailDisplay } from "@/hooks/lms/use-course-thumbnail-display";

export default function CoursesSlugPage() {
  const params = useParams<{ slug: string; studentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug, studentId } = params;
  const courseIdHint = searchParams.get("cid")?.trim() ?? "";
  const isInstructorPreview = searchParams.get("preview") === "1";
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
        const [sidebar, coursePrimary] = await Promise.all([
          getCourseSidebarData(slug, courseIdHint || null),
          (async (): Promise<Course | null> => {
            if (loadById) {
              const byId = await getCourseByIdQueryFn(courseIdHint).catch(
                () => null,
              );
              if (byId?._id) return byId;
              return getCourseBySlugQueryFn(slug).catch(() => null);
            }
            return getCourseBySlugQueryFn(slug).catch(() => null);
          })(),
        ]);
        if (cancelled) return;

        const course = coursePrimary;
        setCourseApi(course);
        if (!course?._id) {
          setEnrolled(false);
          if (process.env.NODE_ENV === "development") {
            console.warn("[COURSE_PREVIEW_RENDER] missing course payload", {
              slug,
              courseIdHint,
              loadById,
              sidebarTitle: sidebar?.course?.title,
            });
          }
          return;
        }

        try {
          await hydrateMyEnrollments();
        } catch {
          /* preview / optional cache */
        }
        let isEn = false;
        try {
          const en = await getEnrollmentStatusQueryFn(course._id);
          isEn =
            !!en && (en.status === "ACTIVE" || en.status === "COMPLETED");
        } catch {
          isEn = false;
        }
        setEnrolled(isEn);

        const chapters = sidebar?.course?.chapter ?? [];
        const firstChapter = chapters[0];
        const firstLesson = firstChapter?.lessons?.[0];
        const isPrivate = course.visibility === "PRIVATE";
        if (
          firstLesson &&
          (isEn || !isPrivate) &&
          !isInstructorPreview
        ) {
          router.push(`/student/${studentId}/courses/${slug}/${firstLesson.id}`);
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.log("[COURSE_PREVIEW_RENDER] shell ok", {
            courseId: course._id,
            preview: isInstructorPreview,
            chapters: chapters.length,
            firstLessonId: firstLesson?.id ?? null,
            enrolled: isEn,
          });
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[COURSE_PREVIEW_RENDER] load failed", e);
        }
        if (!cancelled) setCourseApi(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, studentId, router, hydrateMyEnrollments, courseIdHint, loadById, isInstructorPreview]);

  const rawThumb =
    courseApi?.thumbnailUrl?.trim() ||
    courseApi?.thumbnailKey?.trim() ||
    "";
  const { src: resolvedHeroThumb, onError: onHeroThumbError } =
    useCourseThumbnailDisplay(
      courseApi?._id ?? "",
      rawThumb,
      getCourseByIdQueryFn,
    );

  const thumb =
    resolvedHeroThumb !== COURSE_THUMBNAIL_PLACEHOLDER
      ? resolvedHeroThumb
      : courseApi?.thumbnailUrl?.trim() ||
        "/images/Dashboard.png";
  const useAws = shouldBypassNextImageOptimization(thumb);
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
          onError={onHeroThumbError}
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{courseApi.title}</h1>
        {isInstructorPreview && (
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Instructor preview — course shell (content tree may be empty while you
            edit).
          </p>
        )}
        {(() => {
          const short =
            plainTextFromCourseDescription(courseApi.smallDescription) ||
            courseApi.smallDescription?.trim() ||
            "";
          return short ? (
            <p className="text-muted-foreground mb-4">{short}</p>
          ) : null;
        })()}
        {courseApi.description ? (
          <section className="mb-6 space-y-2">
            <h2 className="text-lg font-semibold">About this course</h2>
            <CourseDescriptionRich description={courseApi.description} />
          </section>
        ) : null}
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
          {enrolled && courseApi?._id ? (
            <Button asChild variant="secondary">
              <Link href={`/community/courses/${courseApi._id}`}>
                <Users className="mr-2 h-4 w-4" />
                Open community
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
