import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction): void => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation error",
      details: result.error.errors,
    });
    return;
  }
  next();
}; 