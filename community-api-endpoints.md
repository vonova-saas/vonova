# Community API Endpoints Documentation

## Overview

This document explains the API endpoints and data flow for the Community module, which consists of two main services:
- **API Gateway Service** (`api-gateway`) - Handles HTTP requests and acts as the entry point
- **App Service** (`app`) - Contains the business logic and database operations

The communication between services uses microservices architecture with message patterns.

---

## Articles API

### API Gateway Endpoints

#### Base Path: `api/v1/community/articles`

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/` | Create a new article with optional images | JWT Required |
| GET | `/` | Get all articles with pagination and filtering | JWT Required |
| GET | `/:id` | Get article by ID | JWT Required |
| GET | `/slug/:slug` | Get article by slug | JWT Required |
| PUT | `/:id` | Update an existing article | JWT Required |
| DELETE | `/:id` | Delete an article | JWT Required |
| PUT | `/:id/approve` | Approve article (admin only) | JWT Required |

#### Key Request/Response Formats

**Create Article (POST /)**
- Content-Type: `multipart/form-data`
- Supports multiple image uploads (max 10 files)
- Fields: `title`, `description`, `contentBlocks` (JSON), `category` (JSON array), `seoMetadata` (JSON), `files`

**Update Article (PUT /:id)**
- Content-Type: `multipart/form-data`
- Supports multiple image uploads (replaces old images)
- Same fields as create, all optional except required fields

**Query Articles (GET /)**
- Query params: `page`, `limit`, `category`, `author`, `status`

### App Service Message Patterns

The app service listens to these message patterns:

| Pattern | Description | Payload |
|---------|-------------|---------|
| `app.community.articles.create` | Create article | `{ dto, image?, images?, userId }` |
| `app.community.articles.update` | Update article | `{ id, dto, image?, images?, userId, role }` |
| `app.community.articles.delete` | Delete article | `{ id }` |
| `app.community.articles.getById` | Get article by ID | `{ id }` |
| `app.community.articles.getBySlug` | Get article by slug | `{ slug }` |
| `app.community.articles.getAll` | Get all articles | `QueryArticlesDto` |
| `app.community.articles.approve` | Approve article | `{ id }` |

### Articles Data Flow

```
Client Request
    |
    v
API Gateway (HTTP)
    |
    v
Validation & File Upload
    |
    v
Message Pattern -> App Service
    |
    v
App Service (Business Logic)
    |
    v
Database Operations
    |
    v
S3 File Upload (if images)
    |
    v
Response -> API Gateway -> Client
```

#### Article Creation Flow:
1. Client sends multipart form data to API Gateway
2. Gateway validates DTO and parses JSON fields
3. Gateway sends message to app service with DTO and files
4. App service processes files (uploads to S3)
5. App service creates article in MongoDB
6. Response flows back through gateway to client

---

## Posts & Comments API

### API Gateway Endpoints

#### Base Path: `api/v1/community/posts`

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/` | Create a new post with optional images | JWT Required |
| GET | `/` | Get all posts with pagination | JWT Required |
| GET | `/user/:userId` | Get posts by specific user | JWT Required |
| GET | `/:postId` | Get post by ID | JWT Required |
| PUT | `/:postId` | Update an existing post | JWT Required |
| DELETE | `/:postId` | Delete a post | JWT Required |
| POST | `/:postId/like` | Toggle like on a post | JWT Required |
| POST | `/:postId/share` | Share a post | JWT Required |

#### Comments Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/:postId/comments` | Add comment to a post | JWT Required |
| GET | `/:postId/comments` | Get comments for a post | JWT Required |
| PUT | `/comments/:commentId` | Update a comment | JWT Required |
| DELETE | `/comments/:commentId` | Delete a comment | JWT Required |
| POST | `/comments/:commentId/like` | Toggle like on a comment | JWT Required |

### App Service Message Patterns

#### Posts Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `app.community.posts.create` | Create post | `{ userId, dto, image?, images? }` |
| `app.community.posts.getAll` | Get all posts | `{ page?, limit? }` |
| `app.community.posts.getByUser` | Get posts by user | `{ userId, page?, limit? }` |
| `app.community.posts.getById` | Get post by ID | `{ postId }` |
| `app.community.posts.update` | Update post | `{ postId, userId, role, dto, image?, images? }` |
| `app.community.posts.delete` | Delete post | `{ postId, userId, role }` |
| `app.community.posts.toggleLike` | Toggle post like | `{ postId, userId }` |
| `app.community.posts.share` | Share post | `{ postId }` |

#### Comments Message Patterns

| Pattern | Description | Payload |
|---------|-------------|---------|
| `app.community.comments.create` | Create comment | `{ postId, userId, dto, image? }` |
| `app.community.comments.getForPost` | Get comments for post | `{ postId, page?, limit? }` |
| `app.community.comments.update` | Update comment | `{ commentId, userId, role, dto, image? }` |
| `app.community.comments.delete` | Delete comment | `{ commentId, userId, role }` |
| `app.community.comments.toggleLike` | Toggle comment like | `{ commentId, userId }` |

### Posts & Comments Data Flow

```
Client Request
    |
    v
API Gateway (HTTP)
    |
    v
Validation & File Upload
    |
    v
Message Pattern -> App Service
    |
    v
App Service (Business Logic)
    |
    v
Database Operations
    |
    v
S3 File Upload (if images)
    |
    v
Response -> API Gateway -> Client
```

#### Post Creation Flow:
1. Client sends multipart form data to API Gateway
2. Gateway validates DTO and processes tags
3. Gateway sends message to app service with DTO and files
4. App service processes images (uploads to S3)
5. App service creates post in MongoDB
6. Response flows back through gateway to client

#### Comment Creation Flow:
1. Client sends comment data to API Gateway
2. Gateway validates and forwards to app service
3. App service creates comment linked to post
4. If image provided, uploads to S3
5. Returns comment with author details

---

## Key Features

### File Upload Handling
- **Multiple Images**: Both articles and posts support multiple image uploads (max 10)
- **S3 Storage**: Images are uploaded to AWS S3 via CommunityS3Service
- **File Validation**: File size and type validation at gateway level
- **Image Replacement**: Update operations replace old images with new ones

### Authentication & Authorization
- **JWT Authentication**: All endpoints require valid JWT token
- **User Context**: User ID extracted from token for ownership checks
- **Role-Based Access**: Admin-only operations (like article approval)
- **Ownership Validation**: Users can only modify their own content (admins can modify all)

### Data Validation
- **DTO Validation**: Class-validator and class-transformer for request validation
- **JSON Parsing**: Multipart form data supports JSON fields as strings
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

### Pagination
- **Standard Pagination**: `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`
- **Default Values**: Page 1, Limit 10 for list endpoints
- **Consistent Format**: Same pagination structure across all list endpoints

---

## Service Architecture

### API Gateway Responsibilities
- HTTP request handling
- Authentication (JWT validation)
- Request validation and transformation
- File upload processing
- Message pattern communication
- Response formatting

### App Service Responsibilities
- Business logic implementation
- Database operations (MongoDB)
- File storage (S3)
- Microservice message handling
- Data relationships and consistency

### Communication Pattern
```
Client -> API Gateway (HTTP) -> App Service (Message Pattern) -> Database
Client <- API Gateway (HTTP) <- App Service (Message Pattern) <- Database
```

This microservices architecture allows for:
- Scalability (services can be scaled independently)
- Separation of concerns (gateway handles HTTP, app handles business logic)
- Resilience (failure in one service doesn't directly affect others)
- Flexibility (easy to add new services or modify existing ones)
