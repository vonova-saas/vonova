"use client";

import { EnrolledCourseType } from "./data/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import useConstructUrl from "@/hooks/courses/use-construct-url";
import Image from "next/image";
import Link from "next/link";
import { useCourseProgress } from "@/hooks/student/lms/use-courses";
import { AIFeedbackButton } from "./ai-feedback-button";
import { User } from "lucide-react";

interface iAppProps {
  data: EnrolledCourseType;
  studentId: string;
}

export function CourseProgressCard({ data, studentId }: iAppProps) {
  const resolvedThumbnailUrl = useConstructUrl(data.Course.thumbnailUrl || "");
  const thumbnailUrl =
    resolvedThumbnailUrl && resolvedThumbnailUrl !== "/images/placeholder.svg"
      ? resolvedThumbnailUrl
      : data.Course.thumbnailUrl?.startsWith("http") ||
          data.Course.thumbnailUrl?.startsWith("/")
        ? data.Course.thumbnailUrl
        : "/placeholder-course.jpg";

  const courseId = data.Course._id;
  const { data: progress, isLoading } = useCourseProgress(courseId);

  const completedLessons = progress?.completedLessonsCount ?? 0;
  const totalLessons = progress?.totalLessons ?? 0;
  const progressPercentage = progress?.progressPercentage ?? 0;

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
        {data.Course.ownerName ? (
          <p
            className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"
            title={`Created by ${data.Course.ownerName}`}
          >
            <User className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">
              by{" "}
              <span className="font-medium text-foreground/80">
                {data.Course.ownerName}
              </span>
            </span>
          </p>
        ) : null}
        <p className="line-clamp-2  text-sm text-muted-foreground leading-tight mt-2">
          {data.Course.smallDescription}
        </p>

        <div className="space-y-4 mt-5">
          <div className="flex justify-between mb-1 text-sm">
            <p>Progress:</p>
            <p className="font-medium">
              {isLoading ? "…" : `${progressPercentage}%`}
            </p>
          </div>

          <Progress value={progressPercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading
              ? "Loading progress…"
              : `${completedLessons} of ${totalLessons} lessons completed`}
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
