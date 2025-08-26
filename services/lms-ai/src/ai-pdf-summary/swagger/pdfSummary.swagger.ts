/**
 * @swagger
 * tags:
 *   - name: AI PDF Summary
 *     description: AI-powered PDF document summarization and chat functionality - All PDF endpoints
 * 
 * components:
 *   schemas:
 *     PDFSummaryRequest:
 *       type: object
 *       required:
 *         - summary_type
 *       properties:
 *         file_url:
 *           type: string
 *           format: uri
 *           description: URL to PDF file (optional if file_content provided)
 *         file_content:
 *           type: string
 *           format: byte
 *           description: Base64 encoded PDF content (optional if file_url provided)
 *         summary_type:
 *           type: string
 *           enum: [brief, detailed, chapter_wise, key_points]
 *           description: Type of summary to generate
 *         focus_areas:
 *           type: array
 *           items:
 *             type: string
 *           description: Specific areas to focus on in summary
 *         max_length:
 *           type: number
 *           minimum: 100
 *           maximum: 10000
 *           description: Maximum length of summary in characters
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID for tracking and personalization
 * 
 *     PDFUploadRequest:
 *       type: object
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: PDF file to upload
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID for tracking
 *         auto_summarize:
 *           type: boolean
 *           description: Whether to automatically generate summary
 *         summary_type:
 *           type: string
 *           enum: [brief, detailed, chapter_wise, key_points]
 *           description: Type of summary to generate if auto_summarize is true
 * 
 *     PDFChatRequest:
 *       type: object
 *       required:
 *         - session_id
 *         - question
 *       properties:
 *         session_id:
 *           type: string
 *           description: Session ID from PDF upload or summary generation
 *         question:
 *           type: string
 *           maxLength: 2000
 *           description: Question about the PDF content
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID for tracking
 *         context_length:
 *           type: number
 *           minimum: 100
 *           maximum: 10000
 *           description: Context length for AI response
 * 
 *     PDFSummaryResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         summary:
 *           type: string
 *           example: "This document provides a comprehensive overview..."
 *         summary_type:
 *           type: string
 *           example: "detailed"
 *         filename:
 *           type: string
 *           example: "document.pdf"
 *         session_id:
 *           type: string
 *           example: "session_123e4567-e89b-12d3-a456-426614174000"
 *         metadata:
 *           type: object
 *           properties:
 *             generated:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *             ai_model_used:
 *               type: string
 *               example: "gpt-4"
 *             processing_time_ms:
 *               type: number
 *               example: 2500
 *             file_size_bytes:
 *               type: number
 *               example: 1048576
 *             total_pages:
 *               type: number
 *               example: 15
 * 
 *     PDFUploadResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         session_id:
 *           type: string
 *           example: "session_123e4567-e89b-12d3-a456-426614174000"
 *         brief_summary:
 *           type: string
 *           example: "Document uploaded successfully"
 *         magic_level:
 *           type: string
 *           example: "expert"
 *         enchantment_status:
 *           type: string
 *           example: "enhanced"
 *         message:
 *           type: string
 *           example: "PDF processed successfully"
 *         metadata:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *               example: "document.pdf"
 *             file_size_bytes:
 *               type: number
 *               example: 1048576
 *             total_pages:
 *               type: number
 *               example: 15
 *             processing_time_ms:
 *               type: number
 *               example: 1500
 * 
 *     PDFChatResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         answer:
 *           type: string
 *           example: "Based on the document content..."
 *         session_id:
 *           type: string
 *           example: "session_123e4567-e89b-12d3-a456-426614174000"
 *         filename:
 *           type: string
 *           example: "document.pdf"
 *         ai_wizard_status:
 *           type: string
 *           example: "active"
 *         magic_level:
 *           type: string
 *           example: "expert"
 *         message:
 *           type: string
 *           example: "Response generated successfully"
 *         metadata:
 *           type: object
 *           properties:
 *             generated:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *             ai_model_used:
 *               type: string
 *               example: "gpt-4"
 *             response_time_ms:
 *               type: number
 *               example: 1200
 *             tokens_used:
 *               type: number
 *               example: 150
 * 
 *   responses:
 *     PDFValidationError:
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
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 * 
 *     PDFNotFound:
 *       description: PDF summary not found
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
 *                 example: "PDF summary not found"
 * 
 *     PDFInternalError:
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
 * /api/pdf-summary/health:
 *   get:
 *     summary: Health check
 *     description: Check if the PDF Summary service is healthy
 *     tags: [AI PDF Summary]
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
 *                 message:
 *                   type: string
 *                   example: "Service is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: "pdf-summary"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */

/**
 * @swagger
 * /api/pdf-summary/stats:
 *   get:
 *     summary: Get service statistics
 *     description: Retrieve service performance and usage statistics
 *     tags: [AI PDF Summary]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: "Statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_summaries:
 *                       type: number
 *                       example: 150
 *                     total_chats:
 *                       type: number
 *                       example: 300
 *                     active_sessions:
 *                       type: number
 *                       example: 25
 *                     average_processing_time:
 *                       type: number
 *                       example: 2.5
 */

/**
 * @swagger
 * /api/pdf-summary/generate:
 *   post:
 *     summary: Generate PDF summary
 *     description: Generate AI-powered summary from PDF file content or URL
 *     tags: [AI PDF Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PDFSummaryRequest'
 *     responses:
 *       201:
 *         description: Summary generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PDFSummaryResponse'
 *       400:
 *         $ref: '#/components/responses/PDFValidationError'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */

/**
 * @swagger
 * /api/pdf-summary/summary/{summaryId}:
 *   get:
 *     summary: Get summary by ID
 *     description: Retrieve a specific PDF summary by its ID
 *     tags: [AI PDF Summary]
 *     parameters:
 *       - in: path
 *         name: summaryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the summary
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID for access control (optional)
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
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
 *                   example: "Summary retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PDFSummaryResponse'
 *       404:
 *         $ref: '#/components/responses/PDFNotFound'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */

/**
 * @swagger
 * /api/pdf-summary/upload:
 *   post:
 *     summary: Upload PDF file
 *     description: Upload a PDF file and optionally generate a summary
 *     tags: [AI PDF Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PDFUploadRequest'
 *     responses:
 *       201:
 *         description: PDF uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PDFUploadResponse'
 *       400:
 *         $ref: '#/components/responses/PDFValidationError'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */

/**
 * @swagger
 * /api/pdf-summary/chat:
 *   post:
 *     summary: Chat with PDF
 *     description: Ask questions about a PDF document using AI
 *     tags: [AI PDF Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PDFChatRequest'
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PDFChatResponse'
 *       400:
 *         $ref: '#/components/responses/PDFValidationError'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */

/**
 * @swagger
 * /api/pdf-summary/chat/rate:
 *   post:
 *     summary: Rate chat response
 *     description: Rate the quality of an AI chat response
 *     tags: [AI PDF Summary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - rating
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of the chat response to rate
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 (poor) to 5 (excellent)
 *     responses:
 *       200:
 *         description: Rating submitted successfully
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
 *                   example: "Rating submitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chatId:
 *                       type: string
 *                     rating:
 *                       type: number
 */

/**
 * @swagger
 * /api/pdf-summary/user/{userId}/summaries:
 *   get:
 *     summary: Get user summaries
 *     description: Retrieve all summaries for a specific user with pagination
 *     tags: [AI PDF Summary]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User summaries retrieved successfully
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
 *                   example: "User summaries retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summaries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PDFSummaryResponse'
 *                     total:
 *                       type: number
 *                       example: 25
 *                     page:
 *                       type: number
 *                       example: 1
 *                     totalPages:
 *                       type: number
 *                       example: 3
 *       400:
 *         $ref: '#/components/responses/PDFValidationError'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */

/**
 * @swagger
 * /api/pdf-summary/session/{sessionId}/chat-history:
 *   get:
 *     summary: Get session chat history
 *     description: Retrieve chat history for a specific PDF session
 *     tags: [AI PDF Summary]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
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
 *                   example: "Chat history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           chatId:
 *                             type: string
 *                           session_id:
 *                             type: string
 *                           question:
 *                             type: string
 *                           answer:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *                       example: 15
 *                     page:
 *                       type: number
 *                       example: 1
 *                     totalPages:
 *                       type: number
 *                       example: 1
 *       400:
 *         $ref: '#/components/responses/PDFValidationError'
 *       500:
 *         $ref: '#/components/responses/PDFInternalError'
 */
