import { Router } from "express";
import {
  getUserProfileController,
  updateUserProfileController,
  getUserSettingsController,
  updateUserSettingsController,
  getDashboardDataController,
  updateDashboardDataController,
  initUserDataController,
} from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { updateDashboardDataSchema, updateUserProfileSchema, updateUserSettingsSchema } from "../validation/user.validation";

const userRoutes = Router();

// Internal endpoint for user data initialization (called by auth service)
userRoutes.post("/init", initUserDataController);

// Dashboard routes
userRoutes.get("/dashboard/:userId", getDashboardDataController);
userRoutes.put("/dashboard/:userId", validateRequest(updateDashboardDataSchema), updateDashboardDataController);

// Profile routes
userRoutes.get("/profile/:userId", getUserProfileController);
userRoutes.put("/profile/:userId", validateRequest(updateUserProfileSchema), updateUserProfileController);

// Settings routes
userRoutes.get("/settings/:userId", getUserSettingsController);
userRoutes.put("/settings/:userId", validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userRoutes;
