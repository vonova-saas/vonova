import API from "@/services/axios-client";

// Student Dashboard Types
export interface StudentDashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalMaterials: number;
  communityPosts: number;
  streakDays: number;
}

export interface LearningActivity {
  date: string;
  minutesLearned: number;
  lessonsCompleted: number;
  quizzesTaken: number;
}

export interface StudentDashboardResponse {
  message: string;
  data: {
    stats: StudentDashboardStats;
    recentActivity: LearningActivity[];
    enrolledCourses: {
      courseId: string;
      title: string;
      thumbnailUrl?: string;
      progress: number;
      lastAccessed: string;
    }[];
    upcomingDeadlines: {
      id: string;
      title: string;
      type: 'quiz' | 'assignment';
      dueDate: string;
      courseName: string;
    }[];
  };
}

// Instructor Dashboard Types
export interface InstructorDashboardStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalStudents: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
  totalMaterials: number;
}

export interface CoursePerformance {
  courseId: string;
  title: string;
  enrollments: number;
  revenue: number;
  rating: number;
  completionRate: number;
}

export interface InstructorDashboardResponse {
  message: string;
  data: {
    stats: InstructorDashboardStats;
    coursePerformance: CoursePerformance[];
    recentEnrollments: {
      studentName: string;
      courseName: string;
      enrolledAt: string;
    }[];
    monthlyRevenue: {
      month: string;
      revenue: number;
    }[];
  };
}

// Student Dashboard APIs
export const getStudentDashboardFn = async (): Promise<StudentDashboardResponse> => {
  const response = await API.get('/api/v1/lms/dashboard/student');
  return response.data;
};

export const getStudentActivityFn = async (
  days = 30
): Promise<{ message: string; data: LearningActivity[] }> => {
  const response = await API.get('/api/v1/lms/dashboard/student/activity', {
    params: { days },
  });
  return response.data;
};

// Instructor Dashboard APIs
export const getInstructorDashboardFn = async (): Promise<InstructorDashboardResponse> => {
  const response = await API.get('/api/v1/lms/dashboard/instructor');
  return response.data;
};

export const getInstructorCoursePerformanceFn = async (
  courseId?: string
): Promise<{ message: string; data: CoursePerformance | CoursePerformance[] }> => {
  const url = courseId
    ? `/api/v1/lms/dashboard/instructor/courses/${courseId}/performance`
    : '/api/v1/lms/dashboard/instructor/courses/performance';
  const response = await API.get(url);
  return response.data;
};

export const getInstructorRevenueFn = async (
  months = 12
): Promise<{ message: string; data: { month: string; revenue: number }[] }> => {
  const response = await API.get('/api/v1/lms/dashboard/instructor/revenue', {
    params: { months },
  });
  return response.data;
};
