/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints for the LMS microservices backend
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification code to their email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Test User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testemail@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Testpass@123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully, you will receive a verification email.
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 *     tags:
 *       - Auth
 *     summary: Log in an existing user
 *     description: Logs in a registered user and returns access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testemail@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Testpass@123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
 *     tags:
 *       - Auth
 *     summary: Verify user email
 *     description: Confirms a user’s email using a verification code sent to their inbox.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 example: testemail@gmail.com
 *               code:
 *                 type: string
 *                 example: 690376
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token. The refresh token must be sent in the Authorization header as Bearer <token>.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refreshed token successfully
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/request-resetPass:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request password reset
 *     description: Sends a password reset code to the user's email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testemail@gmail.com
 *     responses:
 *       200:
 *         description: A reset code has been sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A reset code has been sent successfully
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/verify-resetPass-code:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify password reset code
 *     description: Verifies the reset code sent to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testemail@gmail.com
 *               code:
 *                 type: string
 *                 example: 969874
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset code verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid or expired code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password
 *     description: Resets the user's password using a valid reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: Testpass@1234
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     description: Logs out the currently authenticated user by invalidating the refresh token. Requires the refresh token in the Authorization header as Bearer <token>.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized or no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout from all devices
 *     description: Logs the user out from all devices by invalidating all active refresh tokens. Requires the refresh token in the Authorization header as Bearer <token>.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: User logged out from all devices successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices successfully
 *       401:
 *         description: Unauthorized or no active session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/validate-role-change:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Validate role change request
 *     description: Validates a role change request from the user service. This endpoint is used for inter-service communication to ensure role changes are valid and authorized.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newRole
 *               - adminUserId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose role is being changed
 *                 example: 685edd9be63269894bc97cde
 *               newRole:
 *                 type: string
 *                 enum: [STUDENT, INSTRUCTOR]
 *                 description: The new role to assign to the user
 *                 example: INSTRUCTOR
 *               adminUserId:
 *                 type: string
 *                 description: ID of the admin user making the role change request
 *                 example: 685edd9be63269894bc97cdf
 *     responses:
 *       200:
 *         description: Role change validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role change validation successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentRole:
 *                       type: string
 *                       example: STUDENT
 *                     newRole:
 *                       type: string
 *                       example: INSTRUCTOR
 *                     targetUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 685edd9be63269894bc97cde
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                     adminUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 685edd9be63269894bc97cdf
 *                         name:
 *                           type: string
 *                           example: Admin User
 *                         email:
 *                           type: string
 *                           example: admin@example.com
 *       400:
 *         description: Invalid role change request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - admin user not found or not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 685edd9be63269894bc97cde
 *         name:
 *           type: string
 *           example: Test User
 *         email:
 *           type: string
 *           example: testemail@gmail.com
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           example: null
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: 2025-06-27T18:07:36.696Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-06-27T18:06:19.406Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-06-27T18:07:36.697Z
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Bad Request
 *         message:
 *           type: string
 *           example: Invalid credentials or missing required fields
 */
