"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCourseForm } from "@/components/instructor/lms/courses-management/edit-course/edit-course-form";
import { CourseStrucutre } from "@/components/instructor/lms/courses-management/edit-course/course-strucutre";
import { useCourseManagementStore } from "@/lib/stores";
import useUserId from "@/hooks/user/use-user-id";
import { useParams } from "next/navigation";
import { AdminCourseCardSkeleton } from "@/components/instructor/lms/courses-management/admin-course-card";

export default function EditRoute() {
  const params = useParams<{ courseId: string; instructorId: string }>();
  const courseId = params.courseId;
  const instructorId = params.instructorId;
  const userId = useUserId();
  const effectiveInstructorId = instructorId || userId;
  
  const { currentCourse, loading, error, fetchCourseById } = useCourseManagementStore();
  
  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [courseId, fetchCourseById]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Loading Course...</h1>
        <div className="grid gap-6">
          <AdminCourseCardSkeleton />
          <AdminCourseCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-600">
          Failed to load course: {error}
        </div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Not Found</h1>
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-600">
          Course not found
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Edit Course:
        <span className="text-primary underline">{currentCourse.title || "Untitled"}</span>
      </h1>

      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="course-strucutre">Course Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>
                Provide basic information about the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditCourseForm data={currentCourse} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-strucutre">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
              <CardDescription>
                Here you can update your Course Structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseStrucutre data={currentCourse} instructorId={effectiveInstructorId}/>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
