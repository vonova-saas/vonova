/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: onyx API Gateway
 *   version: 1.0.0
 *   description: |
 *     API Gateway for onyx microservices. All requests to /api/v1/auth/* and /api/v1/user/* are proxied to the respective services.
 *     
 *     - **Auth endpoints:** `/api/v1/auth/...` (proxied to auth service)
 *     - **User endpoints:** `/api/v1/user/...` (proxied to user service)
 *
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints (proxied)
 *   - name: User
 *     description: User profile and settings endpoints (proxied)
 *
 * servers:
 *   - url: http://localhost:4000/api/v1
 *     description: Local API Gateway
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Proxies to the auth service to create a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in an existing user
 *     description: Proxies to the auth service to log in a user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify user email
 *     description: Proxies to the auth service to verify a user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyEmailResponse'
 *       400:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Proxies to the auth service to log out a user.
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       401:
 *         description: Unauthorized or no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /user/profile/{userId}:
 *   get:
 *     tags: [User]
 *     summary: Get user profile
 *     description: Proxies to the user service to retrieve a user's profile.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/User'
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *         code:
 *           type: string
 *     VerifyEmailResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         profilePicture:
 *           type: string
 *           nullable: true
 *         isVerified:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserProfileResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/User'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 */ 