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
    this.errorCode = errorCode;
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
    super(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCodeEnum.INTERNAL_SERVER_ERROR
    );
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.NOT_FOUND,
      errorCode || ErrorCodeEnum.RESOURCE_NOT_FOUND
    );
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.BAD_REQUEST,
      errorCode || ErrorCodeEnum.VALIDATION_ERROR
    );
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden Request", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.FORBIDDEN,
      errorCode || ErrorCodeEnum.FORBIDDEN_REQUEST
    );
  }
}
export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      errorCode || ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }
}

export class TooManyRequestsException extends AppError {
  constructor(message = "Too Many Requests", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.TOO_MANY_REQUESTS,
      errorCode || ErrorCodeEnum.TOO_MANY_REQUESTS
    );
  }
}

export class ServiceUnavailableException extends AppError {
  constructor(message = "Service Unavailable", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.SERVICE_UNAVAILABLE,
      errorCode || ErrorCodeEnum.SERVICE_UNAVAILABLE
    );
  }
}

export class GatewayTimeoutException extends AppError {
  constructor(message = "Gateway Timeout", errorCode?: ErrorCodeEnumType) {
    super(
      message,
      HTTPSTATUS.GATEWAY_TIMEOUT,
      errorCode || ErrorCodeEnum.GATEWAY_TIMEOUT
    );
  }
}