import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

export const createWinstonConfig = () => {
  const logsDir = path.join(process.cwd(), 'logs', 'lms-ai');

  // Custom log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
      });
    })
  );

  // Console format for development
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  );

  const transports: winston.transport[] = [];

  // File transport
  if (process.env.ENABLE_FILE_LOGGING !== 'false') {
    transports.push(
      new (DailyRotateFile as any)({
        filename: path.join(logsDir, 'lms-ai-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.MAX_LOG_FILE_SIZE || '50m',
        maxFiles: process.env.MAX_LOG_FILES || '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      })
    );
  }

  // Console transport
  if (process.env.ENABLE_CONSOLE_LOGGING !== 'false') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'debug'
      })
    );
  }

  return {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'lms-ai' },
    transports
  };
};
