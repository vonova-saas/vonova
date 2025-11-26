import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Extend Request interface to include userId
interface RequestWithUser extends Request {
  userId?: string;
}

@Injectable()
export class SignedContextGuard implements CanActivate {
  private readonly logger = new Logger(SignedContextGuard.name);

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Check if route is public (no auth required)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check authentication
    if (!this.isValidToken(request)) {
      this.logger.warn(`Unauthorized access attempt from IP: ${request.ip}`, {
        path: request.path,
        method: request.method,
        userAgent: request.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      throw new UnauthorizedException('Invalid or missing authentication');
    }

    // Attach user info to request
    request.userId = this.extractUserId(request);
    return true;
  }

  private isValidToken(request: Request): boolean {
    // Check for Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Add your token validation logic here
      return this.validateBearerToken(token);
    }

    // Check for signed context (if you have this feature)
    const signedContext = request.headers['x-signed-context'];
    if (signedContext) {
      return this.validateSignedContext(signedContext as string, request);
    }

    // For development, allow requests without auth
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return false;
  }

  private validateBearerToken(token: string): boolean {
    // Implement your JWT token validation here
    // For now, return true for development
    return true;
  }

  private validateSignedContext(signedContext: string | string[], request: Request): boolean {
    // Implement your signed context validation here
    // This is similar to the Express middleware logic
    try {
      // Parse and validate signed context
      const contextString = Array.isArray(signedContext) ? signedContext[0] : signedContext;
      const context = JSON.parse(Buffer.from(contextString, 'base64').toString());

      // Validate signature, timestamp, etc.
      if (this.isContextValid(context)) {
        return true;
      }
    } catch (error) {
      this.logger.warn('Invalid signed context format', { error: (error as Error).message });
    }

    return false;
  }

  private isContextValid(context: any): boolean {
    // Implement your context validation logic
    // Check timestamp, signature, etc.
    return true; // For development
  }

  private extractUserId(request: Request): string {
    // Extract user ID from token or context
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Decode JWT and extract user ID
      return 'user-123'; // Placeholder
    }

    const signedContext = request.headers['x-signed-context'];
    if (signedContext) {
      try {
        const contextString = Array.isArray(signedContext) ? signedContext[0] : signedContext;
        const context = JSON.parse(Buffer.from(contextString, 'base64').toString());
        return context.userId || 'anonymous';
      } catch (error) {
        return 'anonymous';
      }
    }

    return 'anonymous';
  }
}
