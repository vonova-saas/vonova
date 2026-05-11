"use client";

import { useEffect, useState, useCallback } from "react";
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

const EDIT_TAB_STORAGE_PREFIX = "vonova-instructor-edit-course-tab-";

type EditCourseTab = "basic-info" | "course-strucutre";

export default function EditRoute() {
  const params = useParams<{ courseId: string; instructorId: string }>();
  const courseId = params.courseId;
  const instructorId = params.instructorId;
  const userId = useUserId();
  const effectiveInstructorId = instructorId || userId;
  
  const { currentCourse, loading, error, fetchCourseById } = useCourseManagementStore();

  const [activeTab, setActiveTab] = useState<EditCourseTab>("basic-info");

  useEffect(() => {
    if (typeof window === "undefined" || !courseId) return;
    const key = `${EDIT_TAB_STORAGE_PREFIX}${courseId}`;
    const saved = sessionStorage.getItem(key);
    if (saved === "course-strucutre" || saved === "basic-info") {
      setActiveTab(saved);
    } else {
      setActiveTab("basic-info");
    }
  }, [courseId]);

  const persistTab = useCallback(
    (tab: EditCourseTab) => {
      setActiveTab(tab);
      if (typeof window !== "undefined" && courseId) {
        sessionStorage.setItem(`${EDIT_TAB_STORAGE_PREFIX}${courseId}`, tab);
      }
    },
    [courseId],
  );

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
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => persistTab(v as EditCourseTab)}
        className="w-full"
      >
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
              <EditCourseForm
                key={`${currentCourse._id}-${currentCourse.updatedAt ?? ""}`}
                data={currentCourse}
              />
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
