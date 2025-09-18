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

    // Call App service to verify token
    const response = await axios.post(
      `${Env.APP_SERVICE_URL}/app/auth/verify-token`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Env.INTERNAL_APP_API_KEY,
        },
      }
    );

    // Attach user data to request object for use in route handlers
    req.user = response.data.data.user;
    next();
  } catch (error) {
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
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
