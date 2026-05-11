"use client";

import { Button } from "@/components/ui/button";
import { useStudentCoursesStore } from "@/lib/stores";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { queryClient } from "@/providers/providers";

interface CourseEnrollButtonProps {
  courseId: string;
  studentId: string;
  slug: string;
  price?: { isFree: boolean; amount?: number; currency?: string };
}

export function CourseEnrollButton({
  courseId,
  studentId,
  slug,
  price,
}: CourseEnrollButtonProps) {
  const router = useRouter();
  const { enrollInCourse, isEnrolled, enrollmentsByCourseId, actionLoading } =
    useStudentCoursesStore();

  const enrolled = isEnrolled(courseId);
  const enrollment = enrollmentsByCourseId[courseId];

  async function handleEnroll() {
    if (!studentId) {
      toast.error("Please log in to enroll");
      return;
    }

    const result = await enrollInCourse(courseId);

    if (result) {
      toast.success("Successfully enrolled in course!");
      void queryClient.invalidateQueries({ queryKey: ["course-details"] });
      void queryClient.invalidateQueries({ queryKey: ["course-content"] });
      void queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
      router.push(`/student/${studentId}/courses/${slug}`);
    }
  }

  if (
    enrolled ||
    enrollment?.status === "ACTIVE" ||
    enrollment?.status === "COMPLETED"
  ) {
    return (
      <Button
        onClick={() => router.push(`/student/${studentId}/courses/${slug}`)}
      >
        Continue Learning
      </Button>
    );
  }

  const isFree = price?.isFree || false;
  const priceText = isFree
    ? "Free"
    : `${price?.amount || 0} ${price?.currency || "USD"}`;

  return (
    <Button onClick={handleEnroll} disabled={actionLoading} size="lg">
      {actionLoading
        ? "Enrolling..."
        : isFree
          ? "Enroll for Free"
          : `Enroll Now - ${priceText}`}
    </Button>
  );
}
