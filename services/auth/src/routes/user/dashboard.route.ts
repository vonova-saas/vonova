import { Router } from "express";
import { securityStack } from "../../middlewares/security";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../../middlewares/auth/isAuthorized.middleware";
import {
  getDashboardDataController,
  updateDashboardDataController,
  updateLearningProgressController,
  addQuizPerformanceController,
  updateAIRoadmapController,
  addAIVideoSuggestionController,
  addCourseCreatedController,
} from "../../controllers/user/dashboard.controller";
import {
  updateDashboardDataSchema,
  updateLearningProgressSchema,
  addQuizPerformanceSchema,
  updateAIRoadmapSchema,
  addAIVideoSuggestionSchema,
  addCourseCreatedSchema,
} from "../../validation/user/dashboard.validation";
const userDashboardRoutes = Router();

// Apply security stack to all auth routes
userDashboardRoutes.use(...securityStack);

//? Dashboard routes - users can only access their own dashboard
// Student Dashboard Routes
userDashboardRoutes.patch("/dashboard/:userId/learning-progress", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateLearningProgressSchema), updateLearningProgressController);
userDashboardRoutes.patch("/dashboard/:userId/quiz-performance", isAuthenticated, canAccessOwnData('userId'), validateRequest(addQuizPerformanceSchema), addQuizPerformanceController);
userDashboardRoutes.patch("/dashboard/:userId/ai-roadmap", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateAIRoadmapSchema), updateAIRoadmapController);
userDashboardRoutes.patch("/dashboard/:userId/ai-video-suggestion", isAuthenticated, canAccessOwnData('userId'), validateRequest(addAIVideoSuggestionSchema), addAIVideoSuggestionController);
// Instructor Dashboard Routes
userDashboardRoutes.patch("/dashboard/:userId/courses-created", isAuthenticated, canAccessOwnData('userId'), validateRequest(addCourseCreatedSchema), addCourseCreatedController);
// Shared/Other routes
userDashboardRoutes.get("/dashboard/:userId", isAuthenticated, canAccessOwnData('userId'), getDashboardDataController);
userDashboardRoutes.put("/dashboard/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateDashboardDataSchema), updateDashboardDataController);

export default userDashboardRoutes;
