import { HTTPSTATUS, HttpStatusCodeType } from "../config/http.config";
import { ErrorCodeEnum, ErrorCodeEnumType } from "../enums/error-code.enums";

export class AppError extends Error {
  public statusCode: HttpStatusCodeType;
  public errorCode?: ErrorCodeEnumType;

  constructor(
    message: string,
    statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    errorCode?: ErrorCodeEnumType
  ) {
    super(message);
    this.statusCode = statusCode;
    if (errorCode !== undefined) {
      this.errorCode = errorCode;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpException extends AppError {
  constructor(
    message = "Http Exception Error",
    statusCode: HttpStatusCodeType,
    errorCode?: ErrorCodeEnumType
  ) {
    super(message, statusCode, errorCode);
  }
}

export class InternalServerException extends AppError {
  constructor(
    message = "Internal Server Error",
    errorCode?: ErrorCodeEnumType
  ) {
    const finalErrorCode = errorCode ?? ErrorCodeEnum.INTERNAL_SERVER_ERROR;
    super(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      finalErrorCode
    );
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", errorCode?: ErrorCodeEnumType) {
    const finalErrorCode = errorCode ?? ErrorCodeEnum.RESOURCE_NOT_FOUND;
    super(
      message,
      HTTPSTATUS.NOT_FOUND,
      finalErrorCode
    );
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request", errorCode?: ErrorCodeEnumType) {
    const finalErrorCode = errorCode ?? ErrorCodeEnum.VALIDATION_ERROR;
    super(
      message,
      HTTPSTATUS.BAD_REQUEST,
      finalErrorCode
    );
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden Request", errorCode?: ErrorCodeEnumType) {
    const finalErrorCode = errorCode ?? ErrorCodeEnum.FORBIDDEN_REQUEST;
    super(
      message,
      HTTPSTATUS.FORBIDDEN,
      finalErrorCode
    );
  }
}
export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access", errorCode?: ErrorCodeEnumType) {
    const finalErrorCode = errorCode ?? ErrorCodeEnum.ACCESS_UNAUTHORIZED;
    super(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      finalErrorCode
    );
  }
}