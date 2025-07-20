/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin endpoints for user management in the LMS backend
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users with pagination and filtering
 *     description: Retrieves a paginated list of users with optional filtering by role, status, and search terms. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, INSTRUCTOR, STUDENT, PENDING]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by user active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, and bio fields
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, role, createdAt, lastLogin]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserProfile'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         pages:
 *                           type: integer
 *                           example: 5
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user by ID
 *     description: Retrieves detailed information about a specific user. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update user role
 *     description: Updates the role of a specific user. Role changes are validated with the auth service. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newRole
 *             properties:
 *               newRole:
 *                 type: string
 *                 enum: [STUDENT, INSTRUCTOR]
 *                 description: New role to assign to the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User role updated from STUDENT to INSTRUCTOR
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *                 validation:
 *                   type: string
 *                   example: Role change validated with auth service
 *       400:
 *         description: Invalid role or validation failed
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/users/{userId}/status:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Toggle user status
 *     description: Activates or deactivates a user account. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Whether to activate or deactivate the user
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /admin/statistics/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user statistics
 *     description: Retrieves comprehensive statistics about all users. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 150
 *                     activeUsers:
 *                       type: integer
 *                       example: 120
 *                     verifiedUsers:
 *                       type: integer
 *                       example: 100
 *                     byRole:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: STUDENT
 *                           count:
 *                             type: integer
 *                             example: 80
 *                           activeCount:
 *                             type: integer
 *                             example: 65
 *                           verifiedCount:
 *                             type: integer
 *                             example: 60
 *                     recentRegistrations:
 *                       type: integer
 *                       example: 15
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

/**
 * @swagger
 * /admin/statistics/instructors:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get instructor statistics
 *     description: Retrieves detailed statistics about instructors. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Instructor statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalInstructors:
 *                       type: integer
 *                       example: 25
 *                     byExperience:
 *                       type: object
 *                       properties:
 *                         beginner:
 *                           type: integer
 *                           example: 8
 *                         intermediate:
 *                           type: integer
 *                           example: 12
 *                         expert:
 *                           type: integer
 *                           example: 5
 *                     bySpecialization:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         "Web Development": 10
 *                         "Data Science": 8
 *                         "Mobile Development": 7
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

/**
 * @swagger
 * /admin/statistics/students:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get student statistics
 *     description: Retrieves detailed statistics about students. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: integer
 *                       example: 100
 *                     byLevel:
 *                       type: object
 *                       properties:
 *                         beginner:
 *                           type: integer
 *                           example: 45
 *                         intermediate:
 *                           type: integer
 *                           example: 35
 *                         advanced:
 *                           type: integer
 *                           example: 20
 *                     byLearningStyle:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         "visual": 40
 *                         "auditory": 25
 *                         "kinesthetic": 35
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 685edd9be63269894bc97cde
 *         userId:
 *           type: string
 *           example: 685edd9be63269894bc97cde
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         role:
 *           type: string
 *           enum: [ADMIN, INSTRUCTOR, STUDENT, PENDING]
 *           example: STUDENT
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *           example: https://example.com/avatar.jpg
 *         bio:
 *           type: string
 *           example: Passionate learner
 *         isActive:
 *           type: boolean
 *           example: true
 *         isVerified:
 *           type: boolean
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: 2025-01-27T10:30:00.000Z
 *         joinedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-15T09:00:00.000Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-15T09:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-27T10:30:00.000Z
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Error message
 *         errorCode:
 *           type: string
 *           example: USER_ACCESS_UNAUTHORIZED
 */ 