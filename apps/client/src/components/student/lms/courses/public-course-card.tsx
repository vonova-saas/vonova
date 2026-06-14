"use client";

import { PublicCourseType } from "./data/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCourseThumbnailDisplay } from "@/hooks/lms/use-course-thumbnail-display";
import { getCourseByIdQueryFn } from "@/services/student/lms/courses/real-courses.api";
import { shouldBypassNextImageOptimization } from "@/lib/lms/course-thumbnail";

interface iAppProps {
  data: PublicCourseType;
  studentId: string;
}

export function PublicCourseCard({ data, studentId }: iAppProps) {
  const rawThumb = (data.thumbnailUrl ?? data.thumbnailKey ?? "").trim();
  const { src: thumbnailUrl, onError: onThumbnailError } =
    useCourseThumbnailDisplay(data._id, rawThumb, getCourseByIdQueryFn);

  const difficulty = data.difficulty || "BEGINNER";
  const isFree = data.price?.isFree || false;
  const price = isFree ? "Free" : `${data.price?.amount || 0} ${data.price?.currency || "USD"}`;

  const thumbUnoptimized = shouldBypassNextImageOptimization(thumbnailUrl);

  return (
    <Card className="group relative py-0 gap-0">
      <Badge className="absolute top-2 right-2 z-10">{difficulty}</Badge>

      <Image
        width={600}
        height={400}
        className="w-full rounded-t-xl aspect-video h-full object-cover"
        src={thumbnailUrl}
        alt="Thumbnail Image of Course"
        unoptimized={thumbUnoptimized}
        onError={onThumbnailError}
      />

      <CardContent className="p-4">
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/student/${studentId}/courses/${data.slug}/enroll`}
        >
          {data.title}
        </Link>
        {data.ownerName ? (
          <p
            className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"
            title={`Created by ${data.ownerName}`}
          >
            <User className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">
              by{" "}
              <span className="font-medium text-foreground/80">
                {data.ownerName}
              </span>
            </span>
          </p>
        ) : null}
        <p className="line-clamp-2  text-sm text-muted-foreground leading-tight mt-2">
          {data.smallDescription}
        </p>

        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <Star className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">{data.averageRating || "N/A"}</p>
          </div>

          <div className="flex items-center gap-x-2">
            <Users className="size-6 p-1 rounded-md text-primary bg-primary/10" />
            <p className="text-sm text-muted-foreground">{data.enrollmentCount || 0}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-bold text-primary">{price}</p>
          <Link
            href={`/student/${studentId}/courses/${data.slug}/enroll`}
            className={buttonVariants({ className: "mt-2", size: "sm" })}
          >
            {data.price?.isFree ? "Enroll Free" : "Enroll Now"}
          </Link>
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
