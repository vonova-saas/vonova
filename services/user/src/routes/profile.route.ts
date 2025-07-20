import { Router } from "express";
import {
  getUserProfileController,
  updateUserProfileController,
  initUserDataController,
  updateStudentInfoController,
  updateInstructorInfoController,
  updateAdminInfoController,
} from "../controllers/profile.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import {
  updateUserProfileSchema,
  updateStudentInfoSchema,
  updateInstructorInfoSchema,
  updateAdminInfoSchema
} from "../validation/profile.validation";
import { securityStack } from "../middlewares/security";

const profileRoutes = Router();

// Apply security stack to all auth routes
profileRoutes.use(...securityStack);

// Internal endpoint for user data initialization (called by auth service)
profileRoutes.post("/init", initUserDataController);

//* Profile routes - users can only access their own profile
profileRoutes.get("/profile/:userId", isAuthenticated, canAccessOwnData('userId'), getUserProfileController);
profileRoutes.put("/profile/:userId", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateUserProfileSchema), updateUserProfileController);
profileRoutes.patch("/profile/:userId/student-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateStudentInfoSchema), updateStudentInfoController);
profileRoutes.patch("/profile/:userId/instructor-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateInstructorInfoSchema), updateInstructorInfoController);
profileRoutes.patch("/profile/:userId/admin-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(updateAdminInfoSchema), updateAdminInfoController);

export default profileRoutes;
