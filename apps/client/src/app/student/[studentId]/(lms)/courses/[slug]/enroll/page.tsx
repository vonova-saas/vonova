"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStudentCoursesStore } from "@/lib/stores";
import { CourseEnrollButton } from "@/components/student/lms/courses/course-enroll-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, Clock, BookOpen } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function CourseEnrollPage() {
  const params = useParams<{ slug: string; studentId: string }>();
  const slug = params.slug;
  const studentId = params.studentId;

  const {
    currentCourse,
    loading,
    error,
    fetchCourseBySlug,
    checkEnrollmentStatus,
    isEnrolled,
  } = useStudentCoursesStore();

  useEffect(() => {
    if (slug) {
      fetchCourseBySlug(slug).then((course) => {
        if (course) {
          checkEnrollmentStatus(course._id);
        }
      });
    }
  }, [slug, fetchCourseBySlug, checkEnrollmentStatus]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error) {
    toast.error(error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-600">
          Failed to load course: {error}
        </div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-600">
          Course not found
        </div>
      </div>
    );
  }

  const thumbnailUrl = currentCourse.thumbnailUrl || "/placeholder-course.jpg";
  const difficulty = currentCourse.difficulty || "BEGINNER";
  const isFree = currentCourse.price?.isFree || false;
  const price = isFree
    ? "Free"
    : `${currentCourse.price?.amount || 0} ${currentCourse.price?.currency || "USD"}`;

  const enrolled = isEnrolled(currentCourse._id);

  return (
    <div className="min-h-full w-full pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20">
          <Badge className="mb-4">{difficulty}</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            {currentCourse.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            {currentCourse.description}
          </p>

          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-x-2">
              <Star className="size-6 p-1 rounded-md text-primary bg-primary/10" />
              <span className="font-medium">
                {currentCourse.averageRating || "N/A"} Rating
              </span>
            </div>
            <div className="flex items-center gap-x-2">
              <Users className="size-6 p-1 rounded-md text-primary bg-primary/10" />
              <span className="font-medium">
                {currentCourse.enrollmentCount || 0} Students
              </span>
            </div>
            <div className="flex items-center gap-x-2">
              <BookOpen className="size-6 p-1 rounded-md text-primary bg-primary/10" />
              <span className="font-medium">
                {currentCourse.chapters?.length || 0} Chapters
              </span>
            </div>
            <div className="flex items-center gap-x-2">
              <Clock className="size-6 p-1 rounded-md text-primary bg-primary/10" />
              <span className="font-medium">
                {currentCourse.totalDuration || 0} Hours
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Image
                width={800}
                height={450}
                className="w-full rounded-t-xl aspect-video object-cover"
                src={thumbnailUrl}
                alt={currentCourse.title}
                unoptimized
              />
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {currentCourse.description}
                </p>

                {currentCourse.learningOutcomes && (
                  <>
                    <h3 className="text-lg font-semibold mt-6 mb-3">
                      What You Will Learn
                    </h3>
                    <ul className="space-y-2">
                      {currentCourse.learningOutcomes.map((outcome, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-x-2 text-muted-foreground"
                        >
                          <span className="text-primary mt-1">✓</span>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {currentCourse.prerequisites && (
                  <>
                    <h3 className="text-lg font-semibold mt-6 mb-3">
                      Prerequisites
                    </h3>
                    <ul className="space-y-2">
                      {currentCourse.prerequisites.map((prereq, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-x-2 text-muted-foreground"
                        >
                          <span className="text-primary mt-1">•</span>
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-3xl font-bold text-primary">{price}</div>

                <CourseEnrollButton
                  courseId={currentCourse._id}
                  studentId={studentId}
                  slug={slug}
                  price={currentCourse.price}
                />

                {enrolled && (
                  <p className="text-sm text-green-600 text-center">
                    You are enrolled in this course!
                  </p>
                )}

                <div className="pt-4 border-t space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-medium text-foreground">
                      {currentCourse.totalDuration || 0} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lessons</span>
                    <span className="font-medium text-foreground">
                      {currentCourse.totalLessons || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level</span>
                    <span className="font-medium text-foreground">
                      {difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Language</span>
                    <span className="font-medium text-foreground">
                      {currentCourse.language || "English"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
