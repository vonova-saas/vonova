"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "./general/empty-state";
import { PublicCourseCard, PublicCourseCardSkeleton } from "./public-course-card";
import { CourseProgressCard } from "./course-progress-card";
import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllCourses } from "./data/get-all-courses";
import { getEnrolledCourses } from "./data/get-enrolled-courses";
import useUserId from "@/hooks/user/use-user-id";
import {
  ALL_CATEGORY,
  CategoryPills,
  CategoryValue,
} from "@/components/shared/category-pills";
import type { Course } from "@/types/api/lms/courses.type";
import {
  LMS_COURSE_CATEGORIES,
  formatLmsCourseCategoryLabel,
  normalizeLmsCourseCategory,
} from "@/lib/lms/lms-course-categories";

const courseCategoryPills: readonly string[] = LMS_COURSE_CATEGORIES;

function courseMatchesSelectedCategory(
  course: Course | undefined | null,
  selected: CategoryValue,
): boolean {
  if (selected === ALL_CATEGORY) return true;
  return normalizeLmsCourseCategory(course?.category) === selected;
}

export function CoursesPageClient() {
  const studentId = useUserId();
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["student-courses-hub", "catalog"],
    queryFn: getAllCourses,
  });
  const { data: enrolledCourses = [], isLoading: enrollLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: getEnrolledCourses,
  });
  const loading = coursesLoading || enrollLoading;

  const availableCourses = courses.filter(
    (course) =>
      !enrolledCourses.some(
        ({ Course: enrolled }) => enrolled._id === course._id
      ),
  );

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryValue>(ALL_CATEGORY);

  const filteredEnrolled = useMemo(
    () =>
      enrolledCourses.filter((e) =>
        courseMatchesSelectedCategory(e.Course, selectedCategory),
      ),
    [enrolledCourses, selectedCategory],
  );

  const filteredAvailable = useMemo(
    () =>
      availableCourses.filter((c) =>
        courseMatchesSelectedCategory(c, selectedCategory),
      ),
    [availableCourses, selectedCategory],
  );

  if (loading) {
    return (
      <div className="min-h-full w-full pb-16">
        <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
          <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Student hub
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Courses</h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Loading courses...
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PublicCourseCardSkeleton />
            <PublicCourseCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Student hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Courses</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Access enrolled courses and discover new ones to continue your learning path.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{enrolledCourses.length}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Enrolled
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{availableCourses.length}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Available
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{courses.length}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Total
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="mb-8">
          <CategoryPills
            categories={[...courseCategoryPills]}
            value={selectedCategory}
            onChange={setSelectedCategory}
            getCategoryLabel={formatLmsCourseCategoryLabel}
            hideWhenEmpty={false}
          />
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <h2 className="text-3xl font-bold">Enrolled Courses</h2>
          <p className="text-muted-foreground">
            Here you can see all the courses you have access to
          </p>
        </div>

        {filteredEnrolled.length === 0 ? (
          enrolledCourses.length === 0 ? (
            <EmptyState
              title="No courses purchased yet"
              description="You have not purchased any courses yet"
              buttonText="Browse Courses"
              href="#available"
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">
                No enrolled courses match this category
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Try a different category or clear the filter to see all your enrolled courses.
              </p>
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(ALL_CATEGORY)}
              >
                Clear filter
              </Button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEnrolled.map((course) => (
              <CourseProgressCard key={course.Course._id} data={course} studentId={studentId} />
            ))}
          </div>
        )}

        <section id="available" className="mt-10">
          <div className="flex flex-col gap-2 mb-5">
            <h2 className="text-3xl font-bold">Available Courses</h2>
            <p className="text-muted-foreground">
              Here you can see all the courses you can purchase
            </p>
          </div>

          {filteredAvailable.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {availableCourses.length === 0
                  ? "No courses available"
                  : "No courses match this category"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {availableCourses.length === 0
                  ? courses.length === 0
                    ? "There are no courses in the system yet. Ask an instructor to create and publish a course."
                    : enrolledCourses.length === courses.length
                      ? "You have enrolled in all available courses! Great job!"
                      : "Courses exist but they may be in DRAFT status. Instructors need to publish courses before students can see them."
                  : "Try a different category or clear the filter to see every available course."}
              </p>
              {availableCourses.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategory(ALL_CATEGORY)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAvailable.map((course) => (
                <PublicCourseCard key={course._id} data={course} studentId={studentId} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
