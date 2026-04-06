# Vonova Admin Service

Admin service for the Vonova platform built with Nest.js and connected to API Gateway via NATS messaging.

## Features

- User management (CRUD operations)
- Role-based access control
- User statistics and analytics
- Health monitoring
- NATS microservice integration
- Swagger API documentation
- JWT authentication
- MongoDB integration

## Architecture

This service follows a microservice architecture pattern:

- **HTTP API**: RESTful endpoints for direct access
- **NATS Messaging**: Event-driven communication with API Gateway
- **MongoDB**: Primary data storage
- **JWT**: Authentication and authorization

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
# Edit .env with your configuration
```

## Environment Variables

```bash
# Server Configuration
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/vonova-admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# NATS Configuration
NATS_URL=nats://localhost:4222

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Running the Service

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## NATS Message Patterns

The service listens to the following NATS message patterns:

### User Management

- `admin.get.users` - Get all users with pagination
- `admin.get.user.byId` - Get user by ID
- `admin.update.user.role` - Update user role
- `admin.toggle.user.status` - Activate/deactivate user
- `admin.delete.user` - Delete user

### Statistics

- `admin.get.statistics` - Get user statistics (type: users/instructors/students)

### Message Format

**Request:**

```json
{
  "pattern": "admin.get.users",
  "data": {
    "page": 1,
    "limit": 10,
    "role": "student",
    "isActive": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Users retrieved successfully"
}
```

## HTTP API Endpoints

### Authentication Required

All endpoints require JWT authentication and admin role.

#### User Management

- `GET /admin/users` - Get all users
- `GET /admin/users/:userId` - Get user by ID
- `GET /admin/users/by-role?role=instructor` - Get users by role
- `GET /admin/users/search?query=john` - Search users
- `PUT /admin/users/:userId/role` - Update user role
- `PUT /admin/users/:userId/status` - Toggle user status
- `DELETE /admin/users/:userId` - Delete user

#### Statistics

- `GET /admin/statistics/users` - User statistics
- `GET /admin/statistics/instructors` - Instructor statistics
- `GET /admin/statistics/students` - Student statistics

## Database Schema

### User Collection

```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'instructor' | 'student',
  isActive: boolean,
  isVerified: boolean,
  avatar?: string,
  bio?: string,
  phone?: string,
  lastLoginAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The service returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Operation failed"
}
```

## Development

### Code Structure

```
src/
├── admin/
│   ├── admin.controller.ts     # HTTP endpoints
│   ├── admin.nats.controller.ts # NATS message handlers
│   ├── admin.service.ts        # Business logic
│   ├── dto/
│   │   └── admin.dto.ts      # Data transfer objects
│   └── schemas/
│       └── user.schema.ts     # MongoDB schema
├── auth/
│   ├── auth.module.ts         # Authentication module
│   └── guards/
│       ├── auth.guard.ts       # JWT guard
│       └── roles.guard.ts     # Role-based guard
├── database/
│   └── database.module.ts     # Database configuration
├── health/
│   └── health.controller.ts  # Health checks
├── app.module.ts             # Root module
└── main.ts                  # Application entry point
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov
```

## Deployment

### Docker

```bash
# Build image
docker build -t vonova-admin-service .

# Run container
docker run --rm --env-file .env vonova-app-service

```

### Environment Setup

Ensure the following services are running:

- MongoDB
- NATS Server
- (Optional) API Gateway

## Monitoring

- Health endpoint: `/health`
- Logs: Console output with structured logging
- Metrics: Can be integrated with monitoring tools

## Security

- JWT-based authentication
- Role-based authorization
- Input validation with class-validator
- CORS configuration
- Helmet security headers
- Rate limiting (can be added)
