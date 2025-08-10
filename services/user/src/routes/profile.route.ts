import { Router } from "express";
import * as profileController from "../controllers/profile.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../middlewares/auth/isAuthenticated.middleware";
import { canAccessOwnData } from "../middlewares/auth/isAuthorized.middleware";
import * as profileValidation from "../validation/profile.validation";
import { securityStack } from "../middlewares/security";

const profileRoutes = Router();

// Apply security stack to all auth routes
profileRoutes.use(...securityStack);

// Internal endpoint for user data initialization (called by auth service)
profileRoutes.post("/init", profileController.initUserDataController);

//* Profile routes - users can only access their own profile

//* Get my profile
profileRoutes.get("/profile/me", isAuthenticated, profileController.getMyProfileController);

//* Get user profile
profileRoutes.get("/profile/:userId", isAuthenticated, profileController.getUserProfileController);


//* Update my profile
profileRoutes.patch("/profile/me", isAuthenticated, validateRequest(profileValidation.updateUserProfileSchema), profileController.updateUserProfileController);


profileRoutes.patch("/profile/:userId/student-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(profileValidation.updateStudentInfoSchema), profileController.updateStudentInfoController);


profileRoutes.patch("/profile/:userId/instructor-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(profileValidation.updateInstructorInfoSchema), profileController.updateInstructorInfoController);


profileRoutes.patch("/profile/:userId/admin-info", isAuthenticated, canAccessOwnData('userId'), validateRequest(profileValidation.updateAdminInfoSchema), profileController.updateAdminInfoController);

export default profileRoutes;
