import { ErrorRequestHandler, Response } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { AppError } from "../../utils/appError";
import { z, ZodError } from "zod";
import { ErrorCodeEnum } from "../../enums/error-code.enums";
import { Error } from "mongoose";

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errors: errors,
    errorCode: ErrorCodeEnum.VALIDATION_ERROR,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error Occured on PATH: ${req.path} `, error);

  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON format. Please check your request body.",
    });
  }

  if (error instanceof ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  // Handle Mongoose CastError (e.g., invalid type for a field)
  if (error instanceof Error.CastError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid data type",
      error: `Invalid value '${error.value}' for field '${error.path}'`,
    });
  }

  // Handle other Mongoose validation errors
  if (error instanceof Error.ValidationError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation failed",
      error: error.message,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknow error occurred",
  });
};
