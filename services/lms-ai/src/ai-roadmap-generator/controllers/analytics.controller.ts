import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares/api/asyncHandler.middleware';
import { RoadmapGeneratorService } from '../services/roadmapGenerator.service';

export class AnalyticsController {
  private roadmapService: RoadmapGeneratorService;

  constructor() {
    this.roadmapService = new RoadmapGeneratorService();
  }

  /**
   * Get popular topics
   * GET /api/roadmap/analytics/popular-topics
   */
  getPopularTopics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const days = parseInt(req.query.days as string) || 30;
    const topics = await this.roadmapService.getPopularTopics(days);

    res.status(200).json({
      success: true,
      message: 'Popular topics retrieved successfully',
      data: {
        period_days: days,
        popular_topics: topics,
        generated_at: new Date().toISOString()
      }
    });
  });

  /**
   * Get roadmap analytics
   * GET /api/roadmap/analytics/:roadmapId
   */
  getRoadmapAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { roadmapId } = req.params;
    
    if (!roadmapId) {
      res.status(400).json({
        success: false,
        message: 'Roadmap ID is required'
      });
      return;
    }
    
    const analytics = await this.roadmapService.getRoadmapAnalytics(roadmapId);

    res.status(200).json({
      success: true,
      message: 'Roadmap analytics retrieved successfully',
      data: analytics
    });
  });

  /**
   * Get user analytics
   * GET /api/roadmap/analytics/user/:userId
   */
  getUserAnalytics = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }
    
    const days = parseInt(req.query.days as string) || 30;
    
    // Placeholder for user analytics
    res.status(501).json({
      success: false,
      message: 'User analytics functionality is not yet implemented',
      data: {
        user_id: userId,
        period_days: days
      }
    });
  });
}

// Export singleton instance
export const analyticsController = new AnalyticsController();

// Also export as default for easier importing
export default analyticsController;
