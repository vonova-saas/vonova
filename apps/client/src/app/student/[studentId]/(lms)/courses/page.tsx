// import EmptyState from "@/components/student/lms/courses/general/empty-state";
// import { getAllCourses, PublicCourseType } from "@/components/student/lms/courses/data/get-all-courses";
// import { getEnrolledCourses, EnrolledCourseType } from "@/components/student/lms/courses/data/get-enrolled-courses";
// import { PublicCourseCard } from "@/components/student/lms/courses/public-course-card";
// import { CourseProgressCard } from "@/components/student/lms/courses/course-progress-card";
// import { BookOpen } from "lucide-react";

// export default async function CoursesPage() {
//   const [courses, enrolledCourses] = await Promise.all([
//     getAllCourses(),
//     getEnrolledCourses(),
//   ]) as [PublicCourseType[], EnrolledCourseType[]];

//   const availableCourses = courses.filter(
//     (course) =>
//       !enrolledCourses.some(
//         ({ Course: enrolled }) => enrolled._id === course._id
//       ),
//   );

//   return (
//     <div className="min-h-full w-full pb-16">
//       <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
//         <div
//           aria-hidden
//           className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
//         />
//         <div
//           aria-hidden
//           className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
//         />
//         <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
//           <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
//             <BookOpen className="h-3.5 w-3.5 text-primary" />
//             Student hub
//           </div>
//           <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Courses</h1>
//           <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
//             Access enrolled courses and discover new ones to continue your learning path.
//           </p>
//           <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
//             <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
//               <div className="text-2xl font-semibold tabular-nums md:text-3xl">{enrolledCourses.length}</div>
//               <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
//                 Enrolled
//               </div>
//             </div>
//             <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
//               <div className="text-2xl font-semibold tabular-nums md:text-3xl">{availableCourses.length}</div>
//               <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
//                 Available
//               </div>
//             </div>
//             <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
//               <div className="text-2xl font-semibold tabular-nums md:text-3xl">{courses.length}</div>
//               <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
//                 Total
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <div className="mx-auto max-w-6xl px-4 pt-10">
//       <div className="flex flex-col gap-2 mb-5">
//         <h2 className="text-3xl font-bold">Enrolled Courses</h2>
//         <p className="text-muted-foreground">
//           Here you can see all the courses you have access to
//         </p>
//       </div>

//       {enrolledCourses.length === 0 ? (
//         <EmptyState
//           title="No courses purchased yet"
//           description="You have not purchased any courses yet"
//           buttonText="Browse Courses"
//           href="/courses"
//         />
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {enrolledCourses.map((course) => (
//              <CourseProgressCard  key={course.Course._id} data={course}/>
//           ))}
//         </div>
//       )}

//       <section className="mt-10">
//         <div className="flex flex-col gap-2 mb-5">
//           <h2 className="text-3xl font-bold">Available Courses</h2>
//           <p className="text-muted-foreground">
//             Here you can see all the courses you can purchase
//           </p>
//         </div>

//         {availableCourses.length === 0 ? (
//           <EmptyState
//             title="No courses available"
//             description="You have purchased all available courses"
//             buttonText="Browse Courses"
//             href="/courses"
//           />
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {availableCourses.map((course) => (
//                 <PublicCourseCard key={course._id} data={course} />
//               ))}
//           </div>
//         )}
//       </section>
//       </div>
//     </div>
//   );
// }

import { CoursesPageClient } from "@/components/student/lms/courses/courses-page-client";

export default function CoursesPage() {
  return <CoursesPageClient />;
}