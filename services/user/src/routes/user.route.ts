import { Router } from "express";
import {
  getUserProfileController,
  updateUserProfileController,
  getUserSettingsController,
  updateUserSettingsController,
  initUserDataController,
  updateStudentInfoController,
  updateInstructorInfoController,
  updateAdminInfoController,
} from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import { updateDashboardDataSchema, updateUserProfileSchema, updateUserSettingsSchema } from "../validation/user.validation";

const userRoutes = Router();

// Internal endpoint for user data initialization (called by auth service)
userRoutes.post("/init", initUserDataController);

// Protected routes - require authentication
userRoutes.use(isAuthenticated);

//* Profile routes - users can only access their own profile
userRoutes.get("/profile/:userId", canAccessOwnData('userId'), getUserProfileController);
userRoutes.put("/profile/:userId", canAccessOwnData('userId'), validateRequest(updateUserProfileSchema), updateUserProfileController);
userRoutes.patch("/profile/:userId/student-info", canAccessOwnData('userId'), updateStudentInfoController);
userRoutes.patch("/profile/:userId/instructor-info", canAccessOwnData('userId'), updateInstructorInfoController);
userRoutes.patch("/profile/:userId/admin-info", canAccessOwnData('userId'), updateAdminInfoController);

//! Settings routes - users can only access their own settings
userRoutes.get("/getSettings/:userId", canAccessOwnData('userId'), getUserSettingsController);
userRoutes.put("/updateSettings/:userId", canAccessOwnData('userId'), validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userRoutes;
