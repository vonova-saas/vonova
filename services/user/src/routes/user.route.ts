import { Router } from "express";
import {
  getUserProfileController,
  updateUserProfileController,
  getUserSettingsController,
  updateUserSettingsController,
  getDashboardDataController,
  updateDashboardDataController,
  initUserDataController,
  updateStudentInfoController,
  updateInstructorInfoController,
  updateAdminInfoController,
  updateLearningProgressController,
  addQuizPerformanceController,
  updateAIRoadmapController,
  addAIVideoSuggestionController,
  addCourseCreatedController,
} from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import {
  updateDashboardDataSchema,
  updateUserProfileSchema,
  updateUserSettingsSchema,
  updateLearningProgressSchema,
  addQuizPerformanceSchema,
  updateAIRoadmapSchema,
  addAIVideoSuggestionSchema,
  addCourseCreatedSchema,
  updateStudentInfoSchema,
  updateInstructorInfoSchema,
  updateAdminInfoSchema
} from "../validation/user.validation";
import { securityStack } from "../middlewares/security";

const userRoutes = Router();

// Apply security stack to all auth routes
userRoutes.use(...securityStack);

// Protected routes - require authentication


// Internal endpoint for user data initialization (called by auth service)
userRoutes.post("/init", initUserDataController);

//? Dashboard routes - users can only access their own dashboard
// Student Dashboard Routes
userRoutes.patch("/dashboard/:userId/learning-progress", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateLearningProgressSchema), updateLearningProgressController);
userRoutes.patch("/dashboard/:userId/quiz-performance", isAuthenticated, canAccessOwnData('userId'), validateRequest(addQuizPerformanceSchema), addQuizPerformanceController);
userRoutes.patch("/dashboard/:userId/ai-roadmap", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateAIRoadmapSchema), updateAIRoadmapController);
userRoutes.patch("/dashboard/:userId/ai-video-suggestion", isAuthenticated, canAccessOwnData('userId'), validateRequest(addAIVideoSuggestionSchema), addAIVideoSuggestionController);
// Instructor Dashboard Routes
userRoutes.patch("/dashboard/:userId/courses-created", isAuthenticated, canAccessOwnData('userId'), validateRequest(addCourseCreatedSchema), addCourseCreatedController);
// Shared/Other routes
userRoutes.get("/dashboard/:userId", isAuthenticated, canAccessOwnData('userId'), getDashboardDataController);
userRoutes.put("/dashboard/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateDashboardDataSchema), updateDashboardDataController);

//* Profile routes - users can only access their own profile
userRoutes.get("/profile/:userId", isAuthenticated, canAccessOwnData('userId'), getUserProfileController);
userRoutes.put("/profile/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateUserProfileSchema), updateUserProfileController);
userRoutes.patch("/profile/:userId/student-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateStudentInfoSchema), updateStudentInfoController);
userRoutes.patch("/profile/:userId/instructor-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateInstructorInfoSchema), updateInstructorInfoController);
userRoutes.patch("/profile/:userId/admin-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateAdminInfoSchema), updateAdminInfoController);

//! Settings routes - users can only access their own settings
userRoutes.get("/settings/:userId", isAuthenticated, canAccessOwnData('userId'), getUserSettingsController);
userRoutes.put("/settings/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userRoutes;
