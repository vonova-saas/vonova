import { Request, Response, NextFunction } from 'express';
import { RoadmapGeneratorService } from '../services/roadmapGenerator.service';
import { asyncHandler } from '../../middlewares/api/asyncHandler.middleware';
import { 
  GenerateRoadmapRequestSchema, 
  GetRoadmapRequestSchema,
  UpdateProgressRequestSchema
} from '../validation/roadmap.validation';
import { IRoadmapRequest } from '../models/roadmap.model';

export class RoadmapController {
  private roadmapService: RoadmapGeneratorService;

  constructor() {
    this.roadmapService = new RoadmapGeneratorService();
  }

  generateRoadmap = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GenerateRoadmapRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const request: IRoadmapRequest = {
      topic: validatedData.topic,
      skill_level: validatedData.skill_level,
      duration_weeks: validatedData.duration_weeks,
      focus_areas: validatedData.focus_areas || [],
      ...(validatedData.user_id && { user_id: validatedData.user_id })
    };

    const roadmap = await this.roadmapService.generateRoadmap(
      request,
      req.ip,
      req.get('User-Agent')
    );

    // Return the roadmap response directly without wrapping it
    res.status(201).json(roadmap);
  });

  getRoadmapById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = GetRoadmapRequestSchema.safeParse({
      roadmapId: req.params.roadmapId
    });
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const userId = (req.query.user_id as string) || (req.body.user_id as string);
    const roadmap = await this.roadmapService.getRoadmapById(
      validatedData.roadmapId,
      userId,
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: 'Roadmap retrieved successfully',
      data: roadmap
    });
  });

  // Removed: getUserRoadmaps

  updateProgress = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationResult = UpdateProgressRequestSchema.safeParse({
      roadmapId: req.params.roadmapId,
      ...req.body
    });
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      });
      return;
    }

    const validatedData = validationResult.data;
    const userId = (req.body.user_id as string) || (req.headers['x-user-id'] as string) || '';
    
    await this.roadmapService.updateProgress(
      validatedData.roadmapId,
      userId,
      validatedData.week_number,
      validatedData.milestone_week,
      validatedData.progress_percentage,
      validatedData.time_spent_minutes,
      validatedData.notes,
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully'
    });
  });

  healthCheck = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Simple health check since the service doesn't have a healthCheck method
    res.status(200).json({
      success: true,
      message: 'Roadmap service is healthy',
      data: {
        service: 'roadmap-generator',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  });

  // Removed: getRoadmapAnalytics, getPopularTopics, getGlobalStats, searchRoadmaps
}

// Export singleton instance
export const roadmapController = new RoadmapController();

// Also export as default for easier importing
export default roadmapController;
