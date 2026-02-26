export async function getEnrolledCourses() {
  // Demo-only: return a static list of "enrolled" courses for the demo user
  const data = [
    {
      Course: {
        id: "enrolled-course-1",
        smallDescription: "Quick overview of the MarshalLMS platform.",
        title: "Getting Started with MarshalLMS",
        fileKey: "demo-enrolled-1",
        level: "Beginner",
        slug: "getting-started-with-marshal-lms",
        duration: 2,
        chapter: [
          {
            id: "enrolled-course-1-chapter-1",
            lessons: [
              {
                id: "enrolled-course-1-lesson-1",
                lessonProgress: [
                  {
                    id: "progress-1",
                    completed: false,
                    lessonId: "enrolled-course-1-lesson-1",
                    userId: "demo-user-id",
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  ];

  return data;
}

export type EnrolledCourseType = Awaited<
  ReturnType<typeof getEnrolledCourses>
>[0];
