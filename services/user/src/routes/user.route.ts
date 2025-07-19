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
import { updateDashboardDataSchema, updateUserProfileSchema, updateUserSettingsSchema } from "../validation/user.validation";
import { securityStack } from "../middlewares/security";

const userRoutes = Router();

// Apply security stack to all auth routes
userRoutes.use(...securityStack);

// Protected routes - require authentication
userRoutes.use(isAuthenticated);

// Internal endpoint for user data initialization (called by auth service)
userRoutes.post("/init", initUserDataController);

//? Dashboard routes - users can only access their own dashboard
// Student Dashboard Routes
userRoutes.patch("/dashboard/:userId/learning-progress", canAccessOwnData('userId'), updateLearningProgressController);
userRoutes.patch("/dashboard/:userId/quiz-performance", canAccessOwnData('userId'), addQuizPerformanceController);
userRoutes.patch("/dashboard/:userId/ai-roadmap", canAccessOwnData('userId'), updateAIRoadmapController);
userRoutes.patch("/dashboard/:userId/ai-video-suggestion", canAccessOwnData('userId'), addAIVideoSuggestionController);
// Instructor Dashboard Routes
userRoutes.patch("/dashboard/:userId/courses-created", canAccessOwnData('userId'), addCourseCreatedController);
// Shared/Other routes
userRoutes.get("/dashboard/:userId", canAccessOwnData('userId'), getDashboardDataController);
userRoutes.put("/dashboard/:userId", canAccessOwnData('userId'), validateRequest(updateDashboardDataSchema), updateDashboardDataController);

//* Profile routes - users can only access their own profile
userRoutes.get("/profile/:userId", canAccessOwnData('userId'), getUserProfileController);
userRoutes.put("/profile/:userId", canAccessOwnData('userId'), validateRequest(updateUserProfileSchema), updateUserProfileController);
userRoutes.patch("/profile/:userId/student-info", canAccessOwnData('userId'), updateStudentInfoController);
userRoutes.patch("/profile/:userId/instructor-info", canAccessOwnData('userId'), updateInstructorInfoController);
userRoutes.patch("/profile/:userId/admin-info", canAccessOwnData('userId'), updateAdminInfoController);

//! Settings routes - users can only access their own settings
userRoutes.get("/settings/:userId", canAccessOwnData('userId'), getUserSettingsController);
userRoutes.put("/settings/:userId", canAccessOwnData('userId'), validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userRoutes;
