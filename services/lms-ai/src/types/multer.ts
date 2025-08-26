import { Request } from 'express';

// Extend Express Request to include file property for multer
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
