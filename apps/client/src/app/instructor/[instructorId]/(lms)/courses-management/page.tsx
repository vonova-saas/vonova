import { adminGetCourses } from "@/components/instructor/lms/courses-management/data/admin-get-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AdminCourseCard, AdminCourseCardSkeleton } from "@/components/instructor/lms/courses-management/admin-course-card";
import EmptyState from "@/components/instructor/lms/courses-management/general/empty-state";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Component, Plus } from "lucide-react";

export default function CoursesManagementPage() {
  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <Component className="h-3.5 w-3.5 text-primary" />
            Instructor hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Courses Management</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Create, edit, and organize your courses in one clear workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link className={buttonVariants({ className: "cursor-pointer rounded-full px-8" })} href={`courses-management/create`}>
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Plan</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Structure
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Build</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Content
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">Publish</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Courses
              </div>
            </div>
          </div>
          <div className="mx-auto mt-6 max-w-xl">
            <Card className="bg-card/60">
              <CardContent className="py-4 text-center">
                <div className="text-sm text-muted-foreground">
                  Build, edit, and publish your catalog with the same clean dashboard flow.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 w-full">
      <Suspense fallback={<AdminCourseCardSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses() {
  const data = await adminGetCourses();

  return (
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No Courses found"
          description="Create a new course to get started"
          buttonText="Create Course"
          href={`courses-management/create`}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-6">
          {data.map((course) => (
            <AdminCourseCard key={course._id} data={course} />
          ))}
        </div>
      )}
    </>
  );
}

function AdminCourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  )
}