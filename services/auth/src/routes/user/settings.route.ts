import { Router } from "express";
import * as settingsController from "../../controllers/user/settings.controller";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { isAuthenticated } from "../../middlewares/auth/isAuthenticated.middleware";
import * as settingsValidation from "../../validation/user/settings.validation";
import { securityStack } from "../../middlewares/security";

const userSettingsRoutes = Router();

// Apply security stack to all auth routes
userSettingsRoutes.use(...securityStack);

//! Settings routes - users can only access their own settings
//* Get my settings
userSettingsRoutes.get("/settings/me", isAuthenticated, settingsController.getUserSettingsController);

//* Update my settings
userSettingsRoutes.patch("/settings/me", isAuthenticated, validateRequest(settingsValidation.updateUserSettingsSchema), settingsController.updateUserSettingsController);

export default userSettingsRoutes;
