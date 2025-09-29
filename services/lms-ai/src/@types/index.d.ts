import { UserDocument } from "../../models/auth/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        isVerified: boolean;
        permissions?: string[];
      };
      userDoc?: UserDocument;
      userId?: string;
    }
  }
}

export {};
