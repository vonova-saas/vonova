import UserProfileModel from "../../models/user/userProfile.model";
import UserSettingsModel from "../../models/user/userSettings.model";
import DashboardDataModel from "../../models/user/dashboardData.model";
import { UserRoleEnum } from "../../enums/user/user-role.enum";
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

export const getMyProfileService = async (userId: string) => {
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }
  return profile;
};



export const updateUserProfileService = async (
  userId: string,
  update: any,
) => {

  // Fetch the profile first
  const profile = await UserProfileModel.findOne({ userId });
  if (!profile) {
    throw new NotFoundException("User profile not found");
  }

  const updatedProfile = await UserProfileModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  return updatedProfile;
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
