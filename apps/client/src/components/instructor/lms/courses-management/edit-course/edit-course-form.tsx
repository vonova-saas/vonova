"use client";

import { Button } from "@/components/ui/button";
import {
  courseCategories,
  courseLevels,
  courseSchema,
  CourseSchemaType,
  courseStatus,
} from "@/lib/courses/zodSchema";
import { Loader2, PlusIcon, SparkleIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import slugify from "slugify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "../rich-text-editor/editor";
import { Uploader } from "../file-uploader/uploader";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { updateCourseMutationFn } from "@/services/instructor/course-managment/courses.api";
import { UpdateCourseDto, Course } from "@/types/api/lms/courses.type";
import { queryClient } from "@/providers/providers";
import { useUserId } from "@/hooks";

interface iAppProps {
  data: Course
}

function mapApiLevelToForm(data: Course): CourseSchemaType["level"] {
  const L = (data.level || data.difficulty || "").toString().toUpperCase();
  if (L === "BEGINNER") return "Beginner";
  if (L === "INTERMEDIATE") return "Intermidate";
  return "Advanced";
}

function mapApiCategoryToForm(data: Course): CourseSchemaType["category"] {
  const cat = data.category || "";
  const allowed = courseCategories as readonly string[];
  if (cat && allowed.includes(cat)) {
    return cat as CourseSchemaType["category"];
  }
  return "Development";
}

export function EditCourseForm({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const userId = useUserId();
  const [selectedImageFile, setSelectedImageFile] = useState<File | undefined>(undefined);

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      fileKey: data.thumbnailUrl || "",
      price: data.price?.amount || 0,
      duration: 0,
      level: mapApiLevelToForm(data),
      category: mapApiCategoryToForm(data),
      status: data.status === "DRAFT" ? "Draft" : data.status === "PUBLISHED" ? "Published" : "Archive",
      slug: data.slug,
      smallDescription: data.smallDescription || "",
      visibility: data.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    },
  });

  async function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      try {
        // Validate form data
        const validation = courseSchema.safeParse(values);
        if (!validation.success) {
          toast.error("Invalid Form Data");
          return;
        }

        // Map form values to API DTO
        const updateData: UpdateCourseDto = {
          title: values.title,
          slug: values.slug,
          smallDescription: values.smallDescription,
          description: values.description,
          difficulty:
            values.level === "Intermidate"
              ? "INTERMEDIATE"
              : values.level === "Beginner"
                ? "BEGINNER"
                : "ADVANCED",
          level:
            values.level === "Intermidate"
              ? "INTERMEDIATE"
              : values.level === "Beginner"
                ? "BEGINNER"
                : "ADVANCED",
          category: values.category,
          visibility: values.visibility || "PUBLIC",
          tags: [],
          language: "English",
          price: {
            amount: Number(values.price),
            currency: "USD",
            isFree: Number(values.price) === 0,
          },
          status:
            values.status === "Draft"
              ? "DRAFT"
              : values.status === "Published"
                ? "PUBLISHED"
                : "ARCHIVED",
        };

        if (selectedImageFile) {
          updateData.thumbnailUrl = values.fileKey || undefined;
        }

        await updateCourseMutationFn(data._id, updateData, selectedImageFile);

        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
        queryClient.invalidateQueries({ queryKey: ["instructor-course", data._id] });
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["course-details"] });
        queryClient.invalidateQueries({ queryKey: ["course-details", data._id] });
        queryClient.invalidateQueries({ queryKey: ["my-courses"] });

        toast.success("Course updated successfully");
        setSelectedImageFile(undefined);
        router.push(`/instructor/${userId}/courses-management`);
      } catch (error) {
        console.error("Error updating course:", error);
        toast.error(error instanceof Error ? error.message : "Failed to update course. Please try again.");
      }
    });
  }

  const formRemountKey = `${data._id}-${(data as { updatedAt?: string }).updatedAt ?? ""}-${data.thumbnailUrl ?? ""}`;

  return (
    <Form {...form} key={formRemountKey}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="Slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            className="w-fit"
            onClick={() => {
              const titleValue = form.getValues("title");
              const slug = slugify(titleValue);

              form.setValue("slug", slug, { shouldValidate: true });
            }}
          >
            Generate Slug <SparkleIcon className="ml-1" size={16} />
          </Button>
        </div>

        <FormField
          control={form.control}
          name="smallDescription"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Small Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Small Description"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="w-full">
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
          name="fileKey"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Thumbnail image</FormLabel>
              <FormControl>
                <Uploader
                  key={`course-thumb-${data._id}-${data.thumbnailUrl ?? ""}`}
                  fileTypeAccepted="image"
                  onChange={(url: string, file?: File) => {
                    field.onChange(url);
                    setSelectedImageFile(file);
                  }}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Value" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courseLevels.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Duration (hours)</FormLabel>
                <FormControl>
                  <Input placeholder="Duration" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input placeholder="Price" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public (discoverable)</SelectItem>
                  <SelectItem value="PRIVATE">Private (restricted)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courseStatus.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              Updating...
              <Loader2 className="animate-spin ml-1" />
            </>
          ) : (
            <>
              Update Course <PlusIcon className="ml-1" size={16} />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
