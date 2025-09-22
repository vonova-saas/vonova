import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { HTTPSTATUS } from '../../config/http.config';
import { Env } from '../../config/env.config';

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip token verification for public routes (like health check, login, etc.)
    if (
      req.path === '/' ||
      req.path === '/services' ||
      req.path === '/services/status' ||
      req.path.startsWith('/api/v1/app/health') ||
      req.path.startsWith('/api/v1/app/auth') ||
      req.path.startsWith('/api/v1/app/api-docs') ||
      req.path.startsWith('/api/v1/onyx-portfolio/health') ||
      req.path.startsWith('/api/v1/onyx-portfolio/docs') ||
      req.path.startsWith('/api/v1/onyx-shop/health') ||
      req.path.startsWith('/api/v1/onyx-shop/docs')
    ) {
      return next();
    }

    // Get token from cookie
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Call App service to verify token and retrieve permissions
    // App endpoint expects the token in an http-only cookie and an internal key header
    const response = await axios.post(
      `${Env.APP_SERVICE_URL}/app/auth/verify-and-permissions`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': Env.INTERNAL_API_SECRET_KEY,
          // Forward token as cookie so App can read it
          'Cookie': `accessToken=${token}`,
        },
        // Ensure cookies are included in cross-service requests if needed
        withCredentials: true,
      }
    );

    const data = response.data?.data;
    if (!data?.valid || !data?.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid authentication context returned from App service',
      });
    }

    // Attach user and permissions to request object for downstream handlers
    req.user = {
      userId: data.user.userId,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      isActive: data.user.isActive,
      isVerified: data.user.isVerified,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };

    return next();
  } catch (error: any) {
    // Normalize axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || HTTPSTATUS.UNAUTHORIZED;
      const message = (error.response?.data as any)?.message || 'Error verifying token';
      return res.status(status).json({ success: false, message });
    }

    console.error('Token verification error:', error);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error verifying token',
    });
  }
};

// Type augmentation for Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        isVerified: boolean;
        permissions: string[];
      };
    }
  }
}
