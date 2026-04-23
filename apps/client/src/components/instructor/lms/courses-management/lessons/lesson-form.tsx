"use client";

import { Lesson, UpdateLessonDto } from "@/types/api/lms/courses.type";
import { Uploader } from "../file-uploader/uploader";
import { RichTextEditor } from "../rich-text-editor/editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { lessonSchema, LessonSchemaType } from "@/lib/courses/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateLessonMutationFn } from "@/services/instructor/course-managment/courses.api";
import { queryClient } from "@/providers/providers";
import { toast } from "sonner";
import useUserId from "@/hooks/user/use-user-id";

interface iAppProps {
  data: Lesson;
  chapterId: string;
  courseId: string;
}

export default function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();

  const userId = useUserId();
  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.content ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
    },
  });

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      try {
        // Validate form data
        const validation = lessonSchema.safeParse(values);
        if (!validation.success) {
          toast.error("Invalid form data");
          return;
        }

        // Prepare update data
        const updateData: UpdateLessonDto = {
          title: values.name,
          content: values.description,
          videoKey: values.videoKey,
          thumbnailKey: values.thumbnailKey,
        };

        // Call API directly
        await updateLessonMutationFn(courseId, chapterId, data._id, updateData);

        // Refetch lesson data
        await queryClient.refetchQueries({ queryKey: ["lesson", courseId, chapterId, data._id], type: 'active' });

        toast.success("Lesson updated successfully");
      } catch (error) {
        console.error("Error updating lesson:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update lesson. Please try again.");
      }
    });
  }

  return (
    <div>
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/instructor/${userId}/courses-management/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configration</CardTitle>
          <CardDescription>
            Configure the video and description for this lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lesson Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail Image</FormLabel>
                    <FormControl>
                      <Uploader
                        onChange={field.onChange}
                        value={field.value}
                        fileTypeAccepted="image"
                        courseId={courseId}
                        contentType="lesson"
                        contentId={data._id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video File</FormLabel>
                    <FormControl>
                      <Uploader
                        onChange={field.onChange}
                        value={field.value}
                        fileTypeAccepted="video"
                        courseId={courseId}
                        contentType="lesson"
                        contentId={data._id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Save Lesson"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
