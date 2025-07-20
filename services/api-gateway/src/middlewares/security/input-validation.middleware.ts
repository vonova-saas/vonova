import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface InputValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
}

export interface InputValidationConfig {
  rules: InputValidationRule[];
  location?: 'body' | 'query' | 'params';
  skipRoutes?: string[];
}

export function createInputValidationMiddleware(config: InputValidationConfig): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.skipRoutes && config.skipRoutes.some(pattern => {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(req.path);
    })) {
      next();
      return;
    }
    const source = req[config.location || 'body'];
    for (const rule of config.rules) {
      const value = source[rule.field];
      if (rule.required && (value === undefined || value === null)) {
        res.status(400).json({ error: `Missing required field: ${rule.field}`, errorCode: 'VALIDATION_ERROR' });
        return;
      }
      if (value !== undefined && value !== null) {
        if (rule.type === 'array' && !Array.isArray(value)) {
          res.status(400).json({ error: `Field ${rule.field} must be an array`, errorCode: 'VALIDATION_ERROR' });
          return;
        }
        if (rule.type !== 'array' && typeof value !== rule.type) {
          res.status(400).json({ error: `Field ${rule.field} must be of type ${rule.type}`, errorCode: 'VALIDATION_ERROR' });
          return;
        }
      }
    }
    next();
  };
}
