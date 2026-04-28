/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { EnrolledCourseType } from "./data/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import useConstructUrl from "@/hooks/courses/use-construct-url";
import { useCourseProgress } from "@/hooks/courses/use-course-progress";
import Image from "next/image";
import Link from "next/link";
import { AIFeedbackButton } from "./ai-feedback-button";

interface iAppProps {
  data: EnrolledCourseType;
  studentId: string;
}

export function CourseProgressCard({ data, studentId }: iAppProps) {
  // Use useConstructUrl to resolve thumbnail from IndexedDB storage
  const resolvedThumbnailUrl = useConstructUrl(data.Course.thumbnailUrl || "");
  const thumbnailUrl = resolvedThumbnailUrl && resolvedThumbnailUrl !== "/images/placeholder.svg"
    ? resolvedThumbnailUrl
    : (data.Course.thumbnailUrl?.startsWith("http") || data.Course.thumbnailUrl?.startsWith("/"))
      ? data.Course.thumbnailUrl
      : "/placeholder-course.jpg";
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: data.Course as any });
  return (
    <Card className="group relative py-0 gap-0">
      <Badge className="absolute top-2 right-2 z-10">{data.Course.difficulty}</Badge>

      <Image
        width={600}
        height={400}
        className="w-full rounded-t-xl aspect-video h-full object-cover"
        src={thumbnailUrl}
        alt="Thumbnail Image of Course"
      />

      <CardContent className="p-4">
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/student/${studentId}/courses/${data.Course.slug}`}
        >
          {data.Course.title}
        </Link>
        <p className="line-clamp-2  text-sm text-muted-foreground leading-tight mt-2">
          {data.Course.smallDescription}
        </p>

        <div className="space-y-4 mt-5">
          <div className="flex justify-between mb-1 text-sm">
            <p>Progress:</p>
            <p className="font-medium">{progressPercentage}%</p>
          </div>

          <Progress value={progressPercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>

        <Link
          href={`/student/${studentId}/courses/${data.Course.slug}`}
          className={buttonVariants({ className: "w-full mt-4" })}
        >
          Continue Learning
        </Link>

        <div className="mt-3 flex justify-center">
          <AIFeedbackButton
            courseId={data.Course._id}
            courseTitle={data.Course.title}
            studentId={studentId}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 flex items-center">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="w-full relative h-fit">
        <Skeleton className="w-full rounded-t-xl aspect-video" />
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        <Skeleton className="mt-4 w-full h-10 rounded-md" />
      </CardContent>
    </Card>
  );
}
