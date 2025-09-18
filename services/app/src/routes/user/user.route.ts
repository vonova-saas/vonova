import { Router } from "express";
import { getCurrentUserController } from "../../controllers/user/user.controller";
import { authenticateToken } from "../../middlewares/auth/isAuthenticated.middleware";
import { securityStack } from "../../middlewares/security";
import { isAuthorization } from "../../middlewares/auth/isAuthorization.middleware";
import { Permissions } from "../../enums/role.enum";

const userRoutes = Router();

// Apply security stack to all user routes
userRoutes.use(...securityStack);

// Apply authentication to user routes
userRoutes.use(authenticateToken);

userRoutes.get(
  "/currentUser",
  isAuthorization({ allowSelf: true, permissions: [Permissions.VIEW_ACCOUNT] }),
  getCurrentUserController
);

export default userRoutes;
