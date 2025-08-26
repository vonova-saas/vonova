import { z } from 'zod';

// Base validation schemas
export const SummaryTypeSchema = z.enum(['brief', 'detailed', 'chapter_wise', 'key_points'], {
  errorMap: () => ({ message: 'Summary type must be brief, detailed, chapter_wise, or key_points' })
});

export const FileUrlSchema = z.string()
  .url('Invalid file URL format')
  .max(500, 'File URL must be less than 500 characters')
  .optional();

export const MaxLengthSchema = z.number()
  .int('Max length must be a whole number')
  .min(100, 'Max length must be at least 100 characters')
  .max(10000, 'Max length cannot exceed 10000 characters')
  .optional();

export const FocusAreasSchema = z.array(z.string().min(1).max(100))
  .max(10, 'Maximum 10 focus areas allowed')
  .optional();

export const UserIdSchema = z.string()
  .uuid('Invalid user ID format')
  .optional();

export const SessionIdSchema = z.string()
  .min(1, 'Session ID is required')
  .max(100, 'Session ID must be less than 100 characters');

export const QuestionSchema = z.string()
  .min(1, 'Question is required')
  .max(2000, 'Question must be less than 2000 characters');

export const ContextLengthSchema = z.number()
  .int('Context length must be a whole number')
  .min(100, 'Context length must be at least 100 characters')
  .max(10000, 'Context length cannot exceed 10000 characters')
  .optional();

export const AutoSummarizeSchema = z.boolean()
  .optional()
  .default(false);

// Request validation schemas
export const GenerateSummaryRequestSchema = z.object({
  file_url: FileUrlSchema,
  file_content: z.instanceof(Buffer).optional(),
  summary_type: SummaryTypeSchema,
  focus_areas: FocusAreasSchema,
  max_length: MaxLengthSchema,
  user_id: UserIdSchema
}).strict().refine(
  (data) => data.file_url || data.file_content,
  {
    message: 'Either file_url or file_content must be provided'
  }
);

export const GetSummaryRequestSchema = z.object({
  summaryId: z.string()
    .min(1, 'Summary ID is required')
    .max(100, 'Summary ID must be less than 100 characters')
}).strict();

export const ChatWithPDFRequestSchema = z.object({
  session_id: SessionIdSchema,
  question: QuestionSchema,
  user_id: UserIdSchema,
  context_length: ContextLengthSchema
}).strict();

export const UploadPDFRequestSchema = z.object({
  user_id: UserIdSchema,
  auto_summarize: AutoSummarizeSchema,
  summary_type: SummaryTypeSchema.optional()
}).strict();

export const GetUserSummariesRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10)
}).strict();

export const GetSessionChatHistoryRequestSchema = z.object({
  session_id: SessionIdSchema,
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
}).strict();

export const RateChatResponseSchema = z.object({
  chatId: z.string()
    .min(1, 'Chat ID is required')
    .max(100, 'Chat ID must be less than 100 characters'),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
}).strict();

// Query parameter validation schemas
export const PaginationQuerySchema = z.object({
  page: z.number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page cannot exceed 1000')
    .default(1),
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10)
}).strict();

export const DaysQuerySchema = z.object({
  days: z.number()
    .int('Days must be a whole number')
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365')
    .default(30)
}).strict();

// Type exports
export type GenerateSummaryRequest = z.infer<typeof GenerateSummaryRequestSchema>;
export type GetSummaryRequest = z.infer<typeof GetSummaryRequestSchema>;
export type ChatWithPDFRequest = z.infer<typeof ChatWithPDFRequestSchema>;
export type UploadPDFRequest = z.infer<typeof UploadPDFRequestSchema>;
export type GetUserSummariesRequest = z.infer<typeof GetUserSummariesRequestSchema>;
export type GetSessionChatHistoryRequest = z.infer<typeof GetSessionChatHistoryRequestSchema>;
export type RateChatResponse = z.infer<typeof RateChatResponseSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type DaysQuery = z.infer<typeof DaysQuerySchema>;

// Validation functions
export const validateGenerateSummaryRequest = (data: unknown) => {
  return GenerateSummaryRequestSchema.parse(data);
};

export const validateChatWithPDFRequest = (data: unknown) => {
  return ChatWithPDFRequestSchema.parse(data);
};

export const validateUploadPDFRequest = (data: unknown) => {
  return UploadPDFRequestSchema.parse(data);
};

export const validatePaginationQuery = (query: unknown) => {
  return PaginationQuerySchema.parse(query);
};

export const validateDaysQuery = (query: unknown) => {
  return DaysQuerySchema.parse(query);
};

// Custom error class for validation errors
export class ValidationError extends Error {
  public errors: z.ZodError['errors'];
  public statusCode: number;

  constructor(zodError: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = zodError.errors;
    this.statusCode = 400;
  }
}

export const createValidationError = (error: z.ZodError): ValidationError => {
  return new ValidationError(error);
};
