import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { Error } from 'mongoose';
import { AppError } from '../../utils/appError';
import { HTTPSTATUS } from '../../config/http.config';
import { ErrorCodeEnum } from '../../enums/error-code.enums';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Check if response has already been sent
    if (response.headersSent) {
      console.error(`Error Occurred on PATH: ${request.path} (response already sent)`, exception);
      return;
    }

    console.error(`Error Occurred on PATH: ${request.path}`, exception);

    // Handle Zod validation errors
    if (exception instanceof ZodError) {
      const errors = exception.issues?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return response.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Validation failed',
        errors: errors,
        errorCode: ErrorCodeEnum.VALIDATION_ERROR,
      });
    }

    // Handle custom AppError
    if (exception instanceof AppError) {
      return response.status(exception.statusCode).json({
        message: exception.message,
        errorCode: exception.errorCode,
      });
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      return response.status(status).json({
        message: typeof exceptionResponse === 'string' 
          ? exceptionResponse 
          : (exceptionResponse as any).message || exception.message,
        errorCode: (exceptionResponse as any).errorCode,
      });
    }

    // Handle Mongoose CastError
    if (exception instanceof Error.CastError) {
      return response.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid data type',
        error: `Invalid value '${exception.value}' for field '${exception.path}'`,
      });
    }

    // Handle Mongoose ValidationError
    if (exception instanceof Error.ValidationError) {
      return response.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Validation failed',
        error: exception.message,
      });
    }

    // Handle SyntaxError (invalid JSON)
    if (exception instanceof SyntaxError) {
      return response.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid JSON format. Please check your request body.',
      });
    }

    // Default error
    return response.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      error: exception instanceof Error ? exception.message : 'Unknown error occurred',
    });
  }
}

