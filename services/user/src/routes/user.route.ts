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
userRoutes.get("/dashboard", getDashboardDataController);
userRoutes.put("/dashboard", validateRequest(updateDashboardDataSchema), updateDashboardDataController);

// Profile routes
userRoutes.get("/profile", getUserProfileController);
userRoutes.put("/profile", validateRequest(updateUserProfileSchema), updateUserProfileController);

// Settings routes
userRoutes.get("/settings", getUserSettingsController);
userRoutes.put("/settings", validateRequest(updateUserSettingsSchema), updateUserSettingsController);

export default userRoutes;
