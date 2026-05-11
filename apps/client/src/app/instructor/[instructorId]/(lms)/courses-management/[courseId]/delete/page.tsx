'use client'
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useUserId } from "@/hooks";
import { deleteCourseMutationFn } from "@/services/instructor/course-managment/courses.api";
import { queryClient } from "@/providers/providers";

export default function DeleteCourseRoute() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const userId = useUserId();

  const { courseId } = useParams<{ courseId: string }>();

  async function onSubmit() {
    startTransition(async () => {
      try {
        await deleteCourseMutationFn(courseId);
        
        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["course-details"] });
        queryClient.invalidateQueries({ queryKey: ["my-courses"] });
        
        toast.success("Course deleted successfully");
        router.push(`/instructor/${userId}/courses-management`);
      } catch (error) {
        console.error("Error deleting course:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete course. Please try again.");
      }
    });
  }
  return (
    <div className="max-w-xl mx-auto w-full">
      <Card className="mt-32">
        <CardHeader>
          <CardTitle>Are you sure you want to delete this course?</CardTitle>
          <CardDescription>This action cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between ">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/instructor/${userId}/courses-management`}
          >
            Cancel
          </Link>

          <Button disabled={pending} variant="destructive" onClick={onSubmit}>
            {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting....
                </>
            ) : (
                <>
                  <Trash2 className="size-4"/>
                  Delete
                </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
