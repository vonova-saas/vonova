"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourseSidebarData } from "@/components/student/lms/courses/data/get-course-sidebar-data";

export default function CoursesSlugPage() {
    const params = useParams<{ slug: string; studentId: string }>();
    const router = useRouter();
    const { slug, studentId } = params;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAndRedirect() {
            if (slug) {
                const course = await getCourseSidebarData(slug);
                const firstChapter = course.course.chapter[0];
                const firstLesson = firstChapter?.lessons[0];

                if (firstLesson) {
                    router.push(`/student/${studentId}/courses/${slug}/${firstLesson.id}`);
                } else {
                    setLoading(false);
                }
            }
        }
        fetchAndRedirect();
    }, [slug, studentId, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-48 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-64"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-2">No Lessons Available</h2>
            <p className="text-muted-foreground">This course does not have any lessons yet!</p>
        </div>
    );
}