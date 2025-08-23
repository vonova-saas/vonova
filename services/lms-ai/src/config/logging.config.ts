import { getEnv } from '../utils/get-env';

export interface LoggingConfig {
  // Log levels
  level: string;
  enableConsole: boolean;
  enableFile: boolean;
  
  // File logging settings
  logDirectory: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  
  // Log rotation settings
  enableRotation: boolean;
  rotationInterval: string; // 'daily', 'hourly', 'weekly'
  
  // Performance logging
  enablePerformanceLogging: boolean;
  performanceThreshold: number; // in milliseconds
  
  // Security logging
  enableSecurityLogging: boolean;
  logSensitiveData: boolean;
  
  // AI service logging
  enableAIServiceLogging: boolean;
  logAIRequests: boolean;
  logAIResponses: boolean;
  
  // Database logging
  enableDatabaseLogging: boolean;
  logQueries: boolean;
  logQueryTime: boolean;
  
  // User tracking
  enableUserTracking: boolean;
  logUserActions: boolean;
  logUserProgress: boolean;
  
  // Error logging
  enableErrorLogging: boolean;
  logErrorStack: boolean;
  logErrorContext: boolean;
}

export const getLoggingConfig = (): LoggingConfig => ({
  // Log levels
  level: getEnv('LOG_LEVEL', 'info'),
  enableConsole: getEnv('ENABLE_CONSOLE_LOGGING', 'true') === 'true',
  enableFile: getEnv('ENABLE_FILE_LOGGING', 'true') === 'true',
  
  // File logging settings
  logDirectory: getEnv('LOG_DIRECTORY', 'logs'),
  maxFileSize: parseInt(getEnv('MAX_LOG_FILE_SIZE', '5242880')), // 5MB default
  maxFiles: parseInt(getEnv('MAX_LOG_FILES', '5')),
  
  // Log rotation settings
  enableRotation: getEnv('ENABLE_LOG_ROTATION', 'true') === 'true',
  rotationInterval: getEnv('LOG_ROTATION_INTERVAL', 'daily'),
  
  // Performance logging
  enablePerformanceLogging: getEnv('ENABLE_PERFORMANCE_LOGGING', 'true') === 'true',
  performanceThreshold: parseInt(getEnv('PERFORMANCE_THRESHOLD', '1000')), // 1 second
  
  // Security logging
  enableSecurityLogging: getEnv('ENABLE_SECURITY_LOGGING', 'true') === 'true',
  logSensitiveData: getEnv('LOG_SENSITIVE_DATA', 'false') === 'true',
  
  // AI service logging
  enableAIServiceLogging: getEnv('ENABLE_AI_SERVICE_LOGGING', 'true') === 'true',
  logAIRequests: getEnv('LOG_AI_REQUESTS', 'true') === 'true',
  logAIResponses: getEnv('LOG_AI_RESPONSES', 'false') === 'true', // Don't log full AI responses by default
  
  // Database logging
  enableDatabaseLogging: getEnv('ENABLE_DATABASE_LOGGING', 'true') === 'true',
  logQueries: getEnv('LOG_DATABASE_QUERIES', 'false') === 'true', // Don't log queries by default
  logQueryTime: getEnv('LOG_QUERY_TIME', 'true') === 'true',
  
  // User tracking
  enableUserTracking: getEnv('ENABLE_USER_TRACKING', 'true') === 'true',
  logUserActions: getEnv('LOG_USER_ACTIONS', 'true') === 'true',
  logUserProgress: getEnv('LOG_USER_PROGRESS', 'true') === 'true',
  
  // Error logging
  enableErrorLogging: getEnv('ENABLE_ERROR_LOGGING', 'true') === 'true',
  logErrorStack: getEnv('LOG_ERROR_STACK', 'true') === 'true',
  logErrorContext: getEnv('LOG_ERROR_CONTEXT', 'true') === 'true',
});

// Export the configuration
export const LoggingConfig = getLoggingConfig();
