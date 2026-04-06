import { ApiResponse } from '../types';

export class ResponseUtil {
  static success<T>(data: T, message: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string, error?: string): ApiResponse<null> {
    return {
      success: false,
      error: error || 'Unknown error occurred',
      message,
    };
  }

  static healthCheck(data: any): ApiResponse<any> {
    return this.success(data, 'Health check successful');
  }

  static appInfo(data: any): ApiResponse<any> {
    return this.success(data, 'App info retrieved successfully');
  }
}
