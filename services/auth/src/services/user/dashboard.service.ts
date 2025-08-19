import UserProfileModel from "../../models/user/userProfile.model";
import DashboardDataModel from "../../models/user/dashboardData.model";
import { UserRoleEnum } from "../../enums/user/user-role.enum";
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/appError";

//? ============ Dashboard data Service ============
//* ----------- Student Dashboard Services -----------
// Learning progress tracking (Student)
export const updateLearningProgressService = async (
  userId: string,
  courseId: string,
  progress: number
) => {
  if (progress < 0 || progress > 100) {
    throw new BadRequestException("Progress must be between 0 and 100");
  }

  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  const studentDashboard = getInitializedStudentDashboard(dashboard);
  const enrolledCourses = studentDashboard.enrolledCourses;
  const existingCourseIndex = enrolledCourses.findIndex(
    (course: { courseId: string }) => course.courseId === courseId
  );

  if (existingCourseIndex >= 0) {
    enrolledCourses[existingCourseIndex].progress = progress;
    enrolledCourses[existingCourseIndex].lastAccessed = new Date();

    if (progress === 100) {
      enrolledCourses[existingCourseIndex].completed = true;
      if (!studentDashboard.completedCourses.includes(courseId)) {
        studentDashboard.completedCourses.push(courseId);
      }
    }
  } else {
    enrolledCourses.push({
      courseId,
      title: `Course ${courseId}`,
      progress,
      completed: progress === 100,
      lastAccessed: new Date()
    });
  }

  studentDashboard.enrolledCourses = enrolledCourses;
  await dashboard.save();
  return studentDashboard;
};

// Quiz performance tracking (Student)
export const addQuizPerformanceService = async (
  userId: string,
  quizId: string,
  courseId: string,
  score: number
) => {
  if (score < 0 || score > 100) {
    throw new BadRequestException("Score must be between 0 and 100");
  }

  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  const studentDashboard = getInitializedStudentDashboard(dashboard);
  studentDashboard.quizzesTaken.push({
    quizId,
    courseId,
    score,
    takenAt: new Date()
  });

  await dashboard.save();
  return studentDashboard;
};

// AI features integration (Student)
export const updateAIRoadmapService = async (
  userId: string,
  roadmap: {
    topics: string[];
    recommendedOrder: string[];
  }
) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  const studentDashboard = getInitializedStudentDashboard(dashboard);
  studentDashboard.aiRoadmap = {
    generatedAt: new Date(),
    topics: roadmap.topics,
    recommendedOrder: roadmap.recommendedOrder
  };

  await dashboard.save();
  return studentDashboard;
};

export const addAIVideoSuggestionService = async (
  userId: string,
  suggestion: {
    topic: string;
    videoUrl: string;
  }
) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  const studentDashboard = getInitializedStudentDashboard(dashboard);
  studentDashboard.aiVideoSuggestions.push({
    ...suggestion,
    generatedAt: new Date()
  });

  await dashboard.save();
  return studentDashboard;
};

//* ----------- Instructor Dashboard Services -----------
export const addCourseCreatedService = async (userId: string, course: any) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) throw new NotFoundException("Dashboard data not found");

  if (!dashboard.instructorDashboard) {
    dashboard.instructorDashboard = { coursesCreated: [] };
  }
  dashboard.instructorDashboard.coursesCreated = dashboard.instructorDashboard.coursesCreated || [];
  dashboard.instructorDashboard.coursesCreated.push(course);
  await dashboard.save();
  return dashboard.instructorDashboard;
};

// TODO: Add more instructor dashboard functions as needed, e.g.:

//* ----------- Shared/Other Services -----------
// Get dashboard data
export const getDashboardDataService = async (userId: string, role: string) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  if (role === UserRoleEnum.STUDENT) {
    return getInitializedStudentDashboard(dashboard);
  } else if (role === UserRoleEnum.INSTRUCTOR) {
    return dashboard.instructorDashboard || {};
  } else if (role === UserRoleEnum.ADMIN) {
    return dashboard.adminDashboard || {};
  } else {
    return {};
  }
};

// update dashboard data
export const updateDashboardDataService = async (userId: string, role: string, update: any) => {
  const dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    throw new NotFoundException("Dashboard data not found");
  }

  if (role === UserRoleEnum.STUDENT) {
    dashboard.studentDashboard = { ...dashboard.studentDashboard, ...update };
  } else if (role === UserRoleEnum.INSTRUCTOR) {
    dashboard.instructorDashboard = { ...dashboard.instructorDashboard, ...update };
  } else if (role === UserRoleEnum.ADMIN) {
    dashboard.adminDashboard = { ...dashboard.adminDashboard, ...update };
  }

  await dashboard.save();
  return dashboard;
};

// User activity tracking
export const trackUserActivityService = async (
  userId: string,
  activity: {
    type: string;
    details: any;
    timestamp?: Date;
  }
) => {
  // This could be stored in a separate activity collection
  // For now, we'll update the lastLogin in the profile
  await UserProfileModel.findOneAndUpdate(
    { userId },
    {
      lastLogin: activity.timestamp || new Date(),
      $push: {
        // You might want to add an activities array to the profile model
      }
    }
  );
};

// Helper to always return a fully initialized student dashboard object
const getInitializedStudentDashboard = (dashboard: any) => {
  if (!dashboard.studentDashboard) {
    dashboard.studentDashboard = {
      enrolledCourses: [],
      completedCourses: [],
      quizzesTaken: [],
      materialsAccessed: [],
      aiRoadmap: null,
      aiVideoSuggestions: [],
      aiProblemSolvingStats: null
    };
  }
  return dashboard.studentDashboard;
};
