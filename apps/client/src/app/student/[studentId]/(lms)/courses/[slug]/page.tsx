import { getCourseSidebarData } from "@/components/student/lms/courses/data/get-course-sidebar-data";
import { redirect } from "next/navigation";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursesSlugPage({params} : iAppProps) {
    const {slug} = await params

    const course = await getCourseSidebarData(slug)

    const firstChapter = course.course.chapter[0]
    const firstLesson = firstChapter.lessons[0]

    if(firstLesson){
        redirect(`/courses/${slug}/${firstLesson.id}`)
    }
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold mb-2">No Lessons Available</h2>
            <p className="text-muted-foreground">This course does not have any lessons yet!</p>
        </div>
    )
}