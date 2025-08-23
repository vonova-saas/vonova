# AI Roadmap Generator - Logging System

## Overview

The AI Roadmap Generator service includes a comprehensive logging system built with Winston that tracks all operations, performance metrics, and user activities. The logging system is designed to provide detailed insights into service performance, user behavior, and system health.

## Features

### 🎯 **Custom Log Levels**
- **error**: System errors and failures
- **warn**: Warnings and potential issues
- **info**: General information and system events
- **roadmap**: Roadmap-specific operations (custom level)
- **debug**: Detailed debugging information
- **verbose**: Very detailed information

### 📁 **Multiple Log Outputs**
- **Console**: Colored output for development
- **File**: Persistent storage with rotation
- **Structured**: JSON format for easy parsing

### 🔍 **Comprehensive Tracking**
- HTTP requests and responses
- Database operations and performance
- AI service communication
- User actions and progress
- Performance metrics
- Security events
- Error tracking with context

## Configuration

### Environment Variables

```bash
# Log levels and output
LOG_LEVEL=info
ENABLE_CONSOLE_LOGGING=true
ENABLE_FILE_LOGGING=true

# File logging settings
LOG_DIRECTORY=logs
MAX_LOG_FILE_SIZE=5242880
MAX_LOG_FILES=5

# Performance logging
ENABLE_PERFORMANCE_LOGGING=true
PERFORMANCE_THRESHOLD=1000

# Security logging
ENABLE_SECURITY_LOGGING=true
LOG_SENSITIVE_DATA=false

# AI service logging
ENABLE_AI_SERVICE_LOGGING=true
LOG_AI_REQUESTS=true
LOG_AI_RESPONSES=false

# Database logging
ENABLE_DATABASE_LOGGING=true
LOG_DATABASE_QUERIES=false
LOG_QUERY_TIME=true

# User tracking
ENABLE_USER_TRACKING=true
LOG_USER_ACTIONS=true
LOG_USER_PROGRESS=true

# Error logging
ENABLE_ERROR_LOGGING=true
LOG_ERROR_STACK=true
LOG_ERROR_CONTEXT=true
```

## Usage

### Basic Logging

```typescript
import { roadmapLoggerInstance } from '../utils/roadmap-logger';

// Log roadmap generation
roadmapLoggerInstance.logRoadmapGeneration(
  requestData,
  responseData,
  duration,
  userId
);

// Log errors
roadmapLoggerInstance.logError(
  error,
  'RoadmapService',
  'generateRoadmap',
  userId,
  roadmapId
);

// Log performance
roadmapLoggerInstance.logPerformance(
  'roadmap_generation',
  duration,
  { topic, skillLevel }
);
```

### Using the Logger Class

```typescript
import { RoadmapLogger } from '../utils/roadmap-logger';

const logger = new RoadmapLogger();

// Log different types of events
logger.logRoadmapRetrieval(roadmapId, userId, duration);
logger.logProgressUpdate(roadmapId, userId, weekNumber, progressPercentage);
logger.logAIServiceCall('generate', duration, true);
logger.logDatabaseOperation('find', 'roadmaps', duration, true);
logger.logUserAction('roadmap_viewed', userId, roadmapId);
logger.logSystemEvent('service_started');
logger.logSecurityEvent('unauthorized_access', ip, userId);
```

### Middleware Integration

```typescript
import { loggingMiddleware } from '../middlewares/logging.middleware';

// Apply logging middleware to routes
app.use(loggingMiddleware.request);
app.use(loggingMiddleware.response);

// Apply error logging middleware
app.use(loggingMiddleware.error);

// Log database operations
const startTime = Date.now();
try {
  const result = await RoadmapModel.find(query);
  loggingMiddleware.database('find', 'roadmaps', startTime, true);
} catch (error) {
  loggingMiddleware.database('find', 'roadmaps', startTime, false, error);
}

// Log AI service operations
const startTime = Date.now();
try {
  const response = await callAIService(request);
  loggingMiddleware.aiService('generate', startTime, true, null, request, response);
} catch (error) {
  loggingMiddleware.aiService('generate', startTime, false, error, request);
}
```

## Log Files

The logging system creates several log files in the `logs/` directory:

### 📊 **roadmap-operations.log**
- Contains all roadmap-specific operations
- Includes user actions, progress updates, and roadmap generation
- Level: `roadmap` and above

### ❌ **roadmap-errors.log**
- Contains all error logs
- Includes stack traces and error context
- Level: `error` only

### 📝 **roadmap-all.log**
- Contains all log messages
- Complete service activity log
- All levels

## Log Format

Each log entry includes:

```
[2025-08-22 05:44:30] [ROADMAP] [roadmap-generator] [generate] [User:123] [Roadmap:abc-123] [1500ms] Roadmap generated successfully
```

**Components:**
- **Timestamp**: When the event occurred
- **Level**: Log level (ERROR, WARN, INFO, ROADMAP, DEBUG, VERBOSE)
- **Service**: Service identifier
- **Operation**: What operation was performed
- **User ID**: User who triggered the action (if applicable)
- **Roadmap ID**: Roadmap being operated on (if applicable)
- **Duration**: How long the operation took (if applicable)
- **Message**: Human-readable description
- **Metadata**: Additional structured data

## Performance Monitoring

The logging system automatically tracks:

- **Response times** for all HTTP requests
- **Database query performance** with slow query detection
- **AI service communication** latency
- **User action patterns** and frequency
- **System resource usage** and memory consumption

## Security Logging

Security events are automatically logged:

- **Unauthorized access attempts**
- **Rate limit violations**
- **Suspicious user behavior**
- **API abuse patterns**
- **Authentication failures**

## Best Practices

### 1. **Use Appropriate Log Levels**
```typescript
// Use 'roadmap' level for business operations
logger.log('roadmap', 'Roadmap generated', { roadmapId, userId });

// Use 'info' for general system events
logger.log('info', 'Service started', { port, environment });

// Use 'error' for actual errors
logger.log('error', 'Database connection failed', { error: error.message });
```

### 2. **Include Context in Logs**
```typescript
// Good: Include relevant context
logger.logRoadmapGeneration(request, response, duration, userId);

// Better: Include additional metadata
logger.logRoadmapGeneration(request, response, duration, userId, {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  skillLevel: request.skill_level
});
```

### 3. **Avoid Logging Sensitive Data**
```typescript
// ❌ Don't log sensitive information
logger.log('info', 'User login', { password: userPassword });

// ✅ Log only necessary information
logger.log('info', 'User login', { userId: user.id, email: user.email });
```

### 4. **Use Structured Logging**
```typescript
// ❌ Avoid string concatenation
logger.log('info', `User ${userId} accessed roadmap ${roadmapId}`);

// ✅ Use structured logging
logger.log('info', 'User accessed roadmap', { userId, roadmapId });
```

## Monitoring and Alerting

### Log Analysis

Use tools like:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana** with Loki
- **AWS CloudWatch Logs**
- **Google Cloud Logging**

### Alerting Rules

Set up alerts for:
- Error rate > 5%
- Response time > 2 seconds
- Database query time > 1 second
- AI service failures
- Security events

## Troubleshooting

### Common Issues

1. **Log files not created**
   - Check if `logs/` directory exists
   - Verify write permissions
   - Check environment variables

2. **Performance impact**
   - Reduce log level in production
   - Disable file logging if not needed
   - Use async logging for high-traffic scenarios

3. **Disk space issues**
   - Reduce `MAX_LOG_FILE_SIZE`
   - Reduce `MAX_LOG_FILES`
   - Enable log rotation

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
ENABLE_CONSOLE_LOGGING=true
```

## Examples

### Complete Service Integration

```typescript
import { roadmapLoggerInstance } from './utils/roadmap-logger';
import { loggingMiddleware } from './middlewares/logging.middleware';

// Apply middleware
app.use(loggingMiddleware.request);
app.use(loggingMiddleware.response);

// In your service
export class RoadmapService {
  async generateRoadmap(request: IRoadmapRequest, userId?: string) {
    const startTime = Date.now();
    
    try {
      // Log the start of operation
      roadmapLoggerInstance.logSystemEvent('roadmap_generation_started', {
        topic: request.topic,
        skillLevel: request.skill_level,
        userId
      });

      // Perform the operation
      const result = await this.callAIService(request);
      
      // Log success
      roadmapLoggerInstance.logRoadmapGeneration(
        request,
        result,
        Date.now() - startTime,
        userId
      );

      return result;
    } catch (error) {
      // Log error with context
      roadmapLoggerInstance.logError(
        error,
        'RoadmapService',
        'generateRoadmap',
        userId,
        undefined
      );
      throw error;
    }
  }
}
```

This logging system provides comprehensive visibility into your AI Roadmap Generator service, helping you monitor performance, debug issues, and understand user behavior patterns.
