export type CourseAnalyticsOverview = {
  courseId: string;
  courseTitle: string;
  communityGroupId: string | null;
  totalEnrollments: number;
  activeStudents7d: number;
  completedStudents: number;
  averageProgress: number;
  averageQuizScore: number;
  totalLessons: number;
  totalLessonsCompleted: number;
  lessonCompletionRate: number;
  totalQuizAttempts: number;
  totalProblemsSolved: number;
  growthEnrollments7dPct: number;
  growthActive7dPct: number;
  lastUpdatedAt: string;
  recentActivity: Array<{
    type: string;
    label: string;
    at: string;
    userId?: string;
  }>;
};

export type CourseStudentAnalyticsRow = {
  studentId: string;
  name: string | null;
  email: string | null;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizAverage: number;
  quizAttempts: number;
  problemsSolved: number;
  lastActiveAt: string | null;
  joinedAt: string | null;
  enrollmentStatus: string;
  communityPosts: number;
  chatMessages: number;
};

export type CourseStudentsAnalyticsPage = {
  items: CourseStudentAnalyticsRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type CourseQuizAnalytics = {
  quizzes: Array<{
    quizId: string;
    title: string;
    attempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    avgCompletionMinutes: number | null;
  }>;
  scoreHistogram: Array<{ bucket: string; count: number }>;
  topFailedQuestions: Array<{
    quizId: string;
    quizTitle: string;
    questionId: string;
    failRate: number;
  }>;
};

export type CourseEngagementAnalytics = {
  dailyActiveUsers: Array<{ date: string; count: number }>;
  weeklyActiveUsers: number;
  lessonOpensByDay: Array<{ date: string; count: number }>;
  totalWatchSeconds: number;
  heatmap: Array<{ dayOfWeek: number; hour: number; count: number }>;
};

export type CourseCommunityAnalytics = {
  hasGroup: boolean;
  groupId: string | null;
  postsTotal?: number;
  messagesTotal?: number;
  messagesLast30d?: number;
  commentsTotal?: number;
  postsByType?: Array<{ _id: string; count: number }>;
  topActiveMembers?: Array<{
    _id: unknown;
    count: number;
    likes: number;
    comments: number;
  }>;
};
