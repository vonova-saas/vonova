/**
 * @swagger
 * tags:
 *   - name: AI Roadmap Generator
 *     description: AI-powered learning roadmap generation and management - All roadmap endpoints
 * 
 * components:
 *   schemas:
 *     GenerateRoadmapRequest:
 *       type: object
 *       required:
 *         - topic
 *         - skill_level
 *         - duration_weeks
 *       properties:
 *         topic:
 *           type: string
 *           description: The learning topic
 *           example: "React.js"
 *           minLength: 1
 *           maxLength: 200
 *         skill_level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: The learner's skill level
 *           example: "beginner"
 *         duration_weeks:
 *           type: integer
 *           description: Duration of the roadmap in weeks
 *           example: 12
 *           minimum: 1
 *           maximum: 52
 *         focus_areas:
 *           type: array
 *           items:
 *             type: string
 *           description: Specific areas to focus on
 *           example: ["hooks", "state management", "testing"]
 *           maxItems: 10
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID (optional)
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 * 
 *     UpdateProgressRequest:
 *       type: object
 *       properties:
 *         week_number:
 *           type: integer
 *           description: Completed week number
 *           example: 3
 *           minimum: 1
 *           maximum: 52
 *         milestone_week:
 *           type: integer
 *           description: Reached milestone week
 *           example: 4
 *           minimum: 1
 *           maximum: 52
 *         progress_percentage:
 *           type: number
 *           description: Overall progress percentage
 *           example: 25.5
 *           minimum: 0
 *           maximum: 100
 *         time_spent_minutes:
 *           type: integer
 *           description: Time spent in minutes
 *           example: 120
 *           minimum: 0
 *         notes:
 *           type: string
 *           description: Progress notes
 *           example: "Completed React hooks section"
 *           maxLength: 1000
 * 
 *     RoadmapResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Roadmap generated successfully"
 *         data:
 *           type: object
 *           properties:
 *             status:
 *               type: boolean
 *               example: true
 *             text:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   example: "React.js"
 *                 chapters:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *             tree:
 *               type: array
 *               items:
 *                 type: object
 *             roadmapId:
 *               type: string
 *               format: uuid
 *               example: "123e4567-e89b-12d3-a456-426614174000"
 *             metadata:
 *               type: object
 *               properties:
 *                 generated:
 *                   type: string
 *                   example: "React.js: A 12-Week Beginner Roadmap"
 *                 summary:
 *                   type: string
 *                   example: "12 weeks, 96 total hours"
 * 
 *   responses:
 *     ValidationError:
 *       description: Validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     expected:
 *                       type: string
 *                     received:
 *                       type: string
 *                     path:
 *                       type: array
 *                       items:
 *                         type: string
 *                     message:
 *                       type: string
 * 
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Roadmap not found"
 * 
 *     InternalError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Internal server error"
 */

/**
 * @swagger
 * /api/roadmap/generate:
 *   post:
 *     summary: Generate a new learning roadmap
 *     description: Creates a personalized learning roadmap using AI based on the provided topic, skill level, and duration
 *     tags: [AI Roadmap Generator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateRoadmapRequest'
 *     responses:
 *       201:
 *         description: Roadmap generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoadmapResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/roadmap/{roadmapId}:
 *   get:
 *     summary: Get roadmap by ID
 *     description: Retrieves a specific roadmap by its ID
 *     tags: [AI Roadmap Generator]
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The roadmap ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID for tracking (optional)
 *     responses:
 *       200:
 *         description: Roadmap retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoadmapResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/** Deleted: GET /api/roadmap/user/{userId} */

/**
 * @swagger
 * /api/roadmap/{roadmapId}/progress:
 *   put:
 *     summary: Update roadmap progress
 *     description: Updates the progress for a specific roadmap
 *     tags: [AI Roadmap Generator]
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The roadmap ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UpdateProgressRequest'
 *               - type: object
 *                 required:
 *                   - user_id
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                     description: User ID
 *                     example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progress updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/** Deleted: GET /api/roadmap/{roadmapId}/analytics */

/** Deleted: GET /api/roadmap/popular-topics */

/**
 * @swagger
 * /api/roadmap/health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the roadmap service
 *     tags: [AI Roadmap Generator]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: "roadmap-generator"
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 3600.123
 *                     memory:
 *                       type: object
 *                     environment:
 *                       type: string
 *                       example: "development"
 */

/**
 * @swagger
 * /api/roadmap/test-ai-connection:
 *   get:
 *     summary: Test AI service connection
 *     description: Tests the connectivity between backend and AI service
 *     tags: [AI Roadmap Generator]
 *     responses:
 *       200:
 *         description: AI service connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI service connection successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     backend_service:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         port:
 *                           type: string
 *                           example: "4005"
 *                     ai_service:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         url:
 *                           type: string
 *                           example: "http://localhost:5000"
 *                         response_time_ms:
 *                           type: number
 *                           example: 45
 *                     communication:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "connected"
 *                         latency_ms:
 *                           type: number
 *                           example: 45
 *       503:
 *         description: AI service is not available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to connect to AI service"
 *                 data:
 *                   type: object
 *                   properties:
 *                     troubleshooting:
 *                       type: object
 *                       properties:
 *                         steps:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["1. Verify AI service is running on port 5000", "2. Check configuration"]
 */

/**
 * @swagger
 * /api/roadmap/system-status:
 *   get:
 *     summary: Get comprehensive system status
 *     description: Returns detailed status of all system components
 *     tags: [AI Roadmap Generator]
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "System status retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall_status:
 *                       type: string
 *                       example: "healthy"
 *                     backend:
 *                       type: object
 *                       properties:
 *                         service:
 *                           type: string
 *                           example: "lms-ai-backend"
 *                         port:
 *                           type: string
 *                           example: "4005"
 *                     ai_service:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "connected"
 *                     ports:
 *                       type: object
 *                       properties:
 *                         backend:
 *                           type: integer
 *                           example: 4005
 *                         ai_service:
 *                           type: integer
 *                           example: 5000
 */



