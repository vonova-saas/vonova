"use client";

import { AdminCourseType } from "./data/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId } from "@/hooks";
import {
  ArrowRight,
  Eye,
  MoreVertical,
  Pencil,
  Users,
  Star,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { publishCourseMutationFn, deleteCourseMutationFn } from "@/services/instructor/course-managment/courses.api";
import { toast } from "sonner";
import { useState } from "react";

interface iAppProps {
  data: AdminCourseType;
}

export function AdminCourseCard({ data }: iAppProps) {
  const thumbnailUrl = data.thumbnailUrl || "/placeholder-course.jpg";
  const status = data.status || "DRAFT";
  const isFree = data.price?.isFree || false;
  const price = isFree ? "Free" : `${data.price?.amount || 0} ${data.price?.currency || "USD"}`;
  const userId = useUserId();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusColors = {
    DRAFT: "bg-yellow-500/10 text-yellow-600",
    PUBLISHED: "bg-green-500/10 text-green-600",
    ARCHIVED: "bg-gray-500/10 text-gray-600",
  };

  async function handlePublish() {
    if (status === "PUBLISHED") {
      toast.info("Course is already published");
      return;
    }

    setPublishing(true);
    try {
      await publishCourseMutationFn(data._id, "PUBLISHED");
      toast.success("Course published successfully!");
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      toast.error("Failed to publish course");
      console.error(error);
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCourseMutationFn(data._id);
      toast.success("Course deleted successfully!");
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete course");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="group relative py-0 gap-0" >
      {/* absolute dropdown */}
      <div className="absolute top-2 right-2 z-10" >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/instructor/${userId}/courses-management/${data._id}/edit`}>
                <Pencil className="size-4 mr-2" />
                Edit Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/student/courses/${data.slug}`}>
                <Eye className="size-4 mr-2" />
                Preview
              </Link>
            </DropdownMenuItem>

            {status === "DRAFT" && (
              <DropdownMenuItem onClick={handlePublish} disabled={publishing}>
                <CheckCircle className="size-4 mr-2 text-green-600" />
                {publishing ? "Publishing..." : "Publish Course"}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4 mr-2" />
              {deleting ? "Deleting..." : "Delete Course"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status}
      </div>
      <Image
        src={thumbnailUrl}
        alt="Thumbnail Url"
        width={600}
        height={400}
        className="w-full rounded-t-lg aspect-video f-ull object-cover"
        unoptimized
      />
      <CardContent className="p-4">
        <Link
          href={`/instructor/${userId}/courses-management/${data._id}/edit`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {data.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
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
            className={buttonVariants({
              className: "mt-2",
              size: "sm",
            })}
            href={`/instructor/${userId}/courses-management/${data._id}/edit`}
          >
            Edit Course
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </div>
      </CardContent>
    </Card >
  );
}

export function AdminCourseCardSkeleton() {
  return (
    <Card className="group relative py-0 gap-0">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="w-full relative h-fit">
        <Skeleton className="w-full rounded-t-lg aspect-video h-[250px] object-cover" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-full mb-4 rounded" />
        <div className="mt-4 flex items-center gap-x-5">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>

          <div className="flex items-center gap-x-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        </div>

        <Skeleton className="mt-4 h-10 w-full rounded" />
      </CardContent>
    </Card>
  )
}