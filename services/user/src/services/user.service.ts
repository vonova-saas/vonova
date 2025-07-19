import UserProfileModel from "../models/userProfile.model";
import UserSettingsModel from "../models/userSettings.model";
import DashboardDataModel from "../models/dashboardData.model";
import { UserRoleEnum, UserRoleType } from "../enums/user-role.enum";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from "../utils/appError";

// ============ User Initial Service ============
export const initUserDataService = async (
  userId: string,
  name: string,
  email: string,
  role: string,
) => {
  // Create profile if not exists
  let profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    let profileData: any = { userId, name, email, role };

    if (role === UserRoleEnum.STUDENT) {
      profileData.studentInfo = {
        level: 'beginner',
        preferredLearningStyle: 'visual',
        timezone: 'UTC',
        studyGoals: []
      };
    } else if (role === UserRoleEnum.INSTRUCTOR) {
      profileData.instructorInfo = {
        specialization: [],
        experience: 0,
        education: [],
        certifications: [],
        bio: '',
        hourlyRate: 0,
        availability: { days: [], hours: '' }
      };
    } else if (role === UserRoleEnum.ADMIN) {
      profileData.adminInfo = {
        permissions: [],
        department: '',
        accessLevel: 'regular'
      };
    }

    profile = await UserProfileModel.create(profileData);
  }

  // Create settings if not exists
  let settings = await UserSettingsModel.findOne({ userId });
  if (!settings) {
    settings = await UserSettingsModel.create({ userId });
  }

  // Create dashboard if not exists
  let dashboard = await DashboardDataModel.findOne({ userId });
  if (!dashboard) {
    dashboard = await DashboardDataModel.create({
      userId,
      studentDashboard: {
        enrolledCourses: [],
        completedCourses: [],
        quizzesTaken: [],
        materialsAccessed: [],
        aiRoadmap: null,
        aiVideoSuggestions: [],
        aiProblemSolvingStats: null
      },
      instructorDashboard: null,
      adminDashboard: null
    });
  }

  return {
    profile,
    settings,
    dashboard,
  };
}

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

//* ============ User profile Service ============
export const getUserProfileService = async (userId: string, requesterId?: string) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  // Check if user is requesting their own profile or has admin access
  if (requesterId && requesterId !== userId) {
    const requester = await UserProfileModel.findOne({ userId: requesterId });
    if (!requester || requester.role !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException("You can only access your own profile");
    }
  }

  return profile;
};

export const updateUserProfileService = async (
  userId: string,
  update: any,
  requesterId?: string
) => {
  // Ensure user can only update their own profile (unless admin)
  if (requesterId && requesterId !== userId) {
    const requester = await UserProfileModel.findOne({ userId: requesterId });
    if (!requester || requester.role !== UserRoleEnum.ADMIN) {
      throw new ForbiddenException("You can only update your own profile");
    }
  }

  // Fetch the profile first
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  // Merge top-level fields
  Object.keys(update).forEach((key) => {
    if (
      typeof update[key] === "object" &&
      update[key] !== null &&
      !Array.isArray(update[key]) &&
      (profile as any)[key]
    ) {
      (profile as any)[key] = { ...(profile as any)[key], ...update[key] };
    } else {
      (profile as any)[key] = update[key];
    }
  });

  await profile.save();
  return profile;
};

// Role-specific profile updates
export const updateStudentInfoService = async (userId: string, studentInfo: any) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  if (profile.role !== UserRoleEnum.STUDENT) {
    throw new BadRequestException("User is not a student");
  }

  profile.studentInfo = { ...profile.studentInfo, ...studentInfo };
  await profile.save();

  return profile;
};

export const updateInstructorInfoService = async (userId: string, instructorInfo: any) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  if (profile.role !== UserRoleEnum.INSTRUCTOR) {
    throw new BadRequestException("User is not an instructor");
  }

  profile.instructorInfo = { ...profile.instructorInfo, ...instructorInfo };
  await profile.save();

  return profile;
};

export const updateAdminInfoService = async (userId: string, adminInfo: any) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  if (profile.role !== UserRoleEnum.ADMIN) {
    throw new BadRequestException("User is not an admin");
  }

  profile.adminInfo = { ...profile.adminInfo, ...adminInfo };
  await profile.save();

  return profile;
};

//! ============ User settings Service ============
export const getUserSettingsService = async (userId: string) => {
  const settings = await UserSettingsModel.findOne({ userId });
  if (!settings) {
    throw new NotFoundException("User settings not found");
  }
  return settings;
};

export const updateUserSettingsService = async (userId: string, update: any) => {
  const settings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!settings) {
    throw new NotFoundException("User settings not found");
  }
  return settings;
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
