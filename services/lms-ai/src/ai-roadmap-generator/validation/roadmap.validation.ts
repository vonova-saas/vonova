import { z } from 'zod';

// Base validation schemas
export const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'], {
  errorMap: () => ({ message: 'Skill level must be beginner, intermediate, or advanced' })
});

export const TopicSchema = z.string()
  .min(1, 'Topic is required')
  .max(200, 'Topic must be less than 200 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,()&]+$/, 'Topic contains invalid characters');

export const DurationWeeksSchema = z.number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 week')
  .max(52, 'Duration cannot exceed 52 weeks');

export const FocusAreasSchema = z.array(z.string().min(1).max(100))
  .max(10, 'Maximum 10 focus areas allowed')
  .optional();


export const RoadmapIdSchema = z.string()
  .uuid('Invalid roadmap ID format');

// Request validation schemas
export const GenerateRoadmapRequestSchema = z.object({
  topic: TopicSchema,
  skill_level: SkillLevelSchema,
  duration_weeks: DurationWeeksSchema,
  focus_areas: FocusAreasSchema,
}).strict();

export const GetRoadmapRequestSchema = z.object({
  roadmapId: RoadmapIdSchema
}).strict();

export const UpdateProgressRequestSchema = z.object({
  roadmapId: RoadmapIdSchema,
  week_number: z.number()
    .int('Week number must be a whole number')
    .min(1, 'Week number must be at least 1')
    .max(52, 'Week number cannot exceed 52')
    .optional(),
  milestone_week: z.number()
    .int('Milestone week must be a whole number')
    .min(1, 'Milestone week must be at least 1')
    .max(52, 'Milestone week cannot exceed 52')
    .optional(),
  progress_percentage: z.number()
    .min(0, 'Progress percentage must be at least 0')
    .max(100, 'Progress percentage cannot exceed 100')
    .optional(),
  time_spent_minutes: z.number()
    .int('Time spent must be a whole number')
    .min(0, 'Time spent cannot be negative')
    .max(10080, 'Time spent cannot exceed a week (10080 minutes)')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
}).strict().refine(
  (data) => data.week_number || data.milestone_week || data.progress_percentage !== undefined,
  {
    message: 'At least one progress indicator (week_number, milestone_week, or progress_percentage) must be provided'
  }
);

// Removed: GetUserRoadmapsRequestSchema

// Removed: GetAnalyticsRequestSchema, GetPopularTopicsRequestSchema

// Query parameter validation schemas
export const PaginationQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a positive number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 1000, 'Page must be between 1 and 1000')
    .optional()
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a positive number')
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('10')
});

// Removed: DaysQuerySchema

// Response validation schemas (for testing and documentation)
export const WeekResponseSchema = z.object({
  week: z.number(),
  title: z.string(),
  objectives: z.array(z.string()),
  topics: z.array(z.string()),
  resources: z.array(z.string()),
  projects: z.array(z.string()),
  estimated_hours: z.number()
});

export const MilestoneResponseSchema = z.object({
  week: z.number(),
  milestone: z.string(),
  deliverable: z.string()
});

export const RoadmapDataResponseSchema = z.object({
  roadmapId: z.string(),
  title: z.string(),
  overview: z.string(),
  prerequisites: z.array(z.string()),
  weeks: z.array(WeekResponseSchema),
  milestones: z.array(MilestoneResponseSchema),
  final_project: z.string(),
  next_steps: z.array(z.string()),
  topic: z.string(),
  skill_level: SkillLevelSchema,
  duration_weeks: z.number(),
  focus_areas: z.array(z.string()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  total_estimated_hours: z.number().optional(),
  status: z.enum(['generated', 'in_progress', 'completed', 'archived'])
});

export const RoadmapResponseSchema = z.object({
  status: z.boolean(),
  text: z.object({
    query: z.string(),
    chapters: z.record(z.array(z.string()))
  }),
  tree: z.array(z.object({
    name: z.string(),
    children: z.array(z.object({
      name: z.string(),
      children: z.array(z.object({
        name: z.string()
      }))
    }))
  })),
  roadmapId: z.string(),
  metadata: z.object({
    generated: z.string(),
    summary: z.string()
  }),
  roadmap_data: RoadmapDataResponseSchema.optional()
});

// Type exports for use in controllers
export type GenerateRoadmapRequest = z.infer<typeof GenerateRoadmapRequestSchema>;
export type GetRoadmapRequest = z.infer<typeof GetRoadmapRequestSchema>;
export type UpdateProgressRequest = z.infer<typeof UpdateProgressRequestSchema>;
// Removed type: GetUserRoadmapsRequest
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
// Removed types: GetAnalyticsRequest, GetPopularTopicsRequest, DaysQuery

// Validation helper functions
export const validateGenerateRoadmapRequest = (data: unknown) => {
  return GenerateRoadmapRequestSchema.parse(data);
};

export const validateUpdateProgressRequest = (data: unknown) => {
  return UpdateProgressRequestSchema.parse(data);
};

export const validatePaginationQuery = (query: unknown) => {
  return PaginationQuerySchema.parse(query);
};

// Removed: validateDaysQuery

// Custom validation errors
export class ValidationError extends Error {
  public errors: z.ZodError['errors'];
  
  constructor(zodError: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = zodError.errors;
  }
}

// Validation middleware helper
export const createValidationError = (error: z.ZodError): ValidationError => {
  return new ValidationError(error);
};
