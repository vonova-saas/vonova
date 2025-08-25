import { 
  IRoadmapRequest, 
  IRoadmapResponse, 
  IRoadmapData, 
  IWeek, 
  IMilestone, 
  IChapter, 
  ITreeNode 
} from '../models/roadmap.model';
import RoadmapModel from '../models/roadmap.model';
import RoadmapHistoryModel from '../models/roadmapHistory.model';
import RoadmapResponseModel from '../models/roadmapResponse.model';
import { v4 as uuidv4 } from 'uuid';
import { AppError, BadRequestException, InternalServerException } from '../../utils/appError';
import { HTTPSTATUS } from '../../config/http.config';
import { Env } from '../../config/env.config';
import { 
  roadmapLogger, 
  logAIServiceCall, 
  logDatabaseOperation, 
  logPerformance, 
  logRoadmapGeneration, 
  logUserActivity 
} from '../utils/logger';
import { logAIServiceCallWrapper, logDatabaseOperationWrapper } from '../middlewares/logging.middleware';

/**
 * Roadmap Generator Service
 * Handles AI-powered roadmap generation using external Python service
 */
export class RoadmapGeneratorService {
  private readonly PYTHON_SERVICE_URL: string;
  private readonly DEFAULT_TIMEOUT = 120000; // 120 seconds (2 minutes)

  constructor() {
    this.PYTHON_SERVICE_URL = Env.ROADMAP_AI_SERVICE_URL;
  }

  /**
   * Generate a new learning roadmap
   */
  async generateRoadmap(request: IRoadmapRequest, userIp?: string, userAgent?: string): Promise<any> {
    const startTime = Date.now();
    const roadmapId = uuidv4();
    
    try {
      // Log request start
      roadmapLogger.info('Starting roadmap generation', {
        topic: request.topic,
        skill_level: request.skill_level,
        duration_weeks: request.duration_weeks,
        user_id: request.user_id,
        roadmapId
      });

      // Validate request
      this.validateRoadmapRequest(request);

      // Call Python AI service with logging wrapper
      const aiResponse = await logAIServiceCallWrapper(
        `${this.PYTHON_SERVICE_URL}/generate-roadmap`,
        {
          topic: request.topic,
          skill_level: request.skill_level,
          duration_weeks: request.duration_weeks,
          focus_areas: request.focus_areas?.join(', ') || null
        },
        async () => {
          const response = await fetch(`${this.PYTHON_SERVICE_URL}/generate-roadmap`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: request.topic,
              skill_level: request.skill_level,
              duration_weeks: request.duration_weeks,
              focus_areas: request.focus_areas?.join(', ') || null
            }),
            signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Python service responded with status: ${response.status}, body: ${errorText}`);
          }

          const data = await response.json();
          
          if (!data.status) {
            throw new Error(data.error || 'Python service returned error');
          }

          return data;
        }
      );

      // Use the roadmapId from response or our generated one
      const finalRoadmapId = aiResponse.roadmapId || roadmapId;
      aiResponse.roadmapId = finalRoadmapId;

      // Log successful generation
      const duration = Date.now() - startTime;
      logRoadmapGeneration(finalRoadmapId, request.topic, request.skill_level, duration, true);
      logPerformance('roadmap_generation', duration, {
        topic: request.topic,
        chapters_count: Object.keys(aiResponse.text?.chapters || {}).length
      });

      // Log user activity
      if (request.user_id) {
        logUserActivity(request.user_id, 'roadmap_generated', finalRoadmapId, {
          topic: request.topic,
          skill_level: request.skill_level
        });
      }

      // Optionally save to database in background (don't wait for it)
      this.processAndSaveRoadmapInBackground(aiResponse, request, startTime, userIp, userAgent);
      
      // Return the Python AI service response directly
      return aiResponse;
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Log error with safe property access
      roadmapLogger.error('Roadmap generation failed', {
        topic: request.topic,
        skill_level: request.skill_level,
        duration,
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        roadmapId,
        error_type: error?.constructor?.name || 'Unknown'
      });

      logRoadmapGeneration(roadmapId, request.topic, request.skill_level, duration, false, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Try fallback roadmap generation
      roadmapLogger.info('Attempting fallback roadmap generation', { 
        roadmapId,
        original_error: error?.message || 'Unknown error'
      });
      
      try {
        const fallbackResponse = this.generateFallbackRoadmap(request);
        fallbackResponse.roadmapId = roadmapId;
        
        const fallbackDuration = Date.now() - startTime;
        logRoadmapGeneration(roadmapId, request.topic, request.skill_level, fallbackDuration, true);
        
        roadmapLogger.info('Fallback roadmap generated successfully', {
          roadmapId,
          topic: request.topic,
          fallback_duration: fallbackDuration
        });
        
        // Save fallback roadmap in background
        this.processAndSaveRoadmapInBackground(fallbackResponse, request, startTime, userIp, userAgent);
        
        return fallbackResponse;
      } catch (fallbackError: any) {
        roadmapLogger.error('Fallback roadmap generation also failed', {
          roadmapId,
          original_error: error?.message || 'Unknown error',
          fallback_error: fallbackError?.message || 'Unknown fallback error',
          total_duration: Date.now() - startTime
        });
        
        // Log the final failure
        logRoadmapGeneration(roadmapId, request.topic, request.skill_level, Date.now() - startTime, false, fallbackError);
      }
      
      throw new InternalServerException('Failed to generate roadmap. Please try again.');
    }
  }

  /**
   * Get roadmap by ID
   */
  async getRoadmapById(roadmapId: string, userId?: string, userIp?: string, userAgent?: string): Promise<IRoadmapResponse> {
    try {
      const roadmap = await RoadmapModel.findOne({ roadmapId });
      
      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      // Log view history
      if (userId) {
        await this.logRoadmapHistory(roadmapId, userId, 'viewed', userIp, userAgent);
      }
      
      return this.formatRoadmapResponse(roadmap);
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new InternalServerException('Failed to retrieve roadmap');
    }
  }

  /**
   * Get user's roadmaps
   */
  async getUserRoadmaps(userId: string, page = 1, limit = 10): Promise<{
    roadmaps: IRoadmapResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [roadmaps, total] = await Promise.all([
        RoadmapModel.find({ user_id: userId })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit),
        RoadmapModel.countDocuments({ user_id: userId })
      ]);

      return {
        roadmaps: roadmaps.map((roadmap: IRoadmapData) => this.formatRoadmapResponse(roadmap)),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
      
    } catch (error) {
      throw new InternalServerException('Failed to retrieve user roadmaps');
    }
  }

  /**
   * Update roadmap progress
   */
  async updateProgress(
    roadmapId: string, 
    userId: string, 
    weekNumber?: number, 
    milestoneWeek?: number,
    progressPercentage?: number,
    timeSpentMinutes?: number,
    notes?: string,
    userIp?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const roadmap = await RoadmapModel.findOne({ roadmapId, user_id: userId });
      
      if (!roadmap) {
        throw new BadRequestException('Roadmap not found or access denied');
      }

      // Determine action type
      let action: 'started' | 'week_completed' | 'milestone_reached' | 'completed' = 'started';
      
      if (progressPercentage === 100) {
        action = 'completed';
        roadmap.status = 'completed';
      } else if (milestoneWeek) {
        action = 'milestone_reached';
      } else if (weekNumber) {
        action = 'week_completed';
      }

      // Update roadmap status if needed
      if (roadmap.status === 'generated' && (weekNumber || progressPercentage)) {
        roadmap.status = 'in_progress';
      }

      await roadmap.save();

      // Log progress history
      await this.logRoadmapHistory(
        roadmapId, 
        userId, 
        action, 
        userIp, 
        userAgent,
        {
          week_number: weekNumber,
          milestone_week: milestoneWeek,
          progress_percentage: progressPercentage,
          time_spent_minutes: timeSpentMinutes,
          notes
        }
      );
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new InternalServerException('Failed to update progress');
    }
  }

  /**
   * Get roadmap analytics
   */
  async getRoadmapAnalytics(roadmapId: string): Promise<any> {
    try {
      const [roadmap, completionStats, userProgress] = await Promise.all([
        RoadmapModel.findOne({ roadmapId }),
        RoadmapHistoryModel.aggregate([
          { $match: { roadmapId: roadmapId } },
          { 
            $group: {
              _id: '$action',
              count: { $sum: 1 },
              unique_users: { $addToSet: '$user_id' }
            }
          },
          {
            $project: {
              action: '$_id',
              count: 1,
              unique_user_count: { $size: '$unique_users' }
            }
          }
        ]),
        RoadmapHistoryModel.find({ roadmapId }).sort({ timestamp: -1 }).limit(100)
      ]);

      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      return {
        roadmap: {
          id: roadmap.roadmapId,
          topic: roadmap.topic,
          skill_level: roadmap.skill_level,
          duration_weeks: roadmap.duration_weeks,
          total_hours: roadmap.total_estimated_hours,
          created_at: roadmap.created_at
        },
        stats: completionStats,
        recent_activity: userProgress
      };
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new InternalServerException('Failed to retrieve analytics');
    }
  }

  /**
   * Get popular topics
   */
  async getPopularTopics(days = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      return await RoadmapHistoryModel.aggregate([
        { 
          $match: { 
            action: 'generated',
            timestamp: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'roadmaps',
            localField: 'roadmapId',
            foreignField: 'roadmapId',
            as: 'roadmap'
          }
        },
        { $unwind: '$roadmap' },
        {
          $group: {
            _id: '$roadmap.topic',
            count: { $sum: 1 },
            skill_levels: { $addToSet: '$roadmap.skill_level' },
            avg_duration: { $avg: '$roadmap.duration_weeks' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
    } catch (error) {
      throw new InternalServerException('Failed to retrieve popular topics');
    }
  }

  // Private methods

  private validateRoadmapRequest(request: IRoadmapRequest): void {
    if (!request.topic || request.topic.trim().length === 0) {
      throw new BadRequestException('Topic is required');
    }

    if (request.topic.length > 200) {
      throw new BadRequestException('Topic must be less than 200 characters');
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(request.skill_level)) {
      throw new BadRequestException('Invalid skill level. Must be beginner, intermediate, or advanced');
    }

    if (request.duration_weeks < 1 || request.duration_weeks > 52) {
      throw new BadRequestException('Duration must be between 1 and 52 weeks');
    }

    if (request.focus_areas && request.focus_areas.length > 10) {
      throw new BadRequestException('Maximum 10 focus areas allowed');
    }
  }

  private async findSimilarRoadmap(request: IRoadmapRequest): Promise<IRoadmapData | null> {
    try {
      const similarRoadmaps = await RoadmapModel.find({
        topic: { $regex: request.topic, $options: 'i' },
        skill_level: request.skill_level,
        duration_weeks: { $gte: request.duration_weeks - 2, $lte: request.duration_weeks + 2 }
      }).sort({ created_at: -1 }).limit(1);

      return similarRoadmaps.length > 0 ? similarRoadmaps[0] as IRoadmapData : null;
    } catch (error) {
      console.warn('Error finding similar roadmap:', error);
      return null;
    }
  }

  private shouldUseCachedRoadmap(existingRoadmap: IRoadmapData, request: IRoadmapRequest): boolean {
    // Use cached roadmap if it's less than 7 days old and matches closely
    const daysSinceCreation = (Date.now() - existingRoadmap.created_at.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 7 && 
           existingRoadmap.topic.toLowerCase().includes(request.topic.toLowerCase()) &&
           existingRoadmap.skill_level === request.skill_level;
  }


  private generateFallbackRoadmap(request: IRoadmapRequest): any {
    const roadmapId = uuidv4();
    const weeks = Array.from({ length: request.duration_weeks }, (_, i) => ({
      week: i + 1,
      title: `Week ${i + 1}: ${i < 2 ? 'Foundation' : 'Advanced Topics'}`,
      objectives: [`Master week ${i + 1} concepts`],
      topics: [`${request.topic} Basics`, 'Practical Applications', 'Hands-on Practice'],
      resources: ['Official documentation', 'Online courses', 'Practice exercises'],
      projects: [`Week ${i + 1} hands-on project`],
      estimated_hours: 8
    }));

    const milestones = [];
    if (request.duration_weeks >= 4) {
      milestones.push({
        week: Math.max(1, Math.floor(request.duration_weeks / 3)),
        milestone: 'Foundation Established',
        deliverable: 'Basic competency'
      });
    }

    const chapters = {
      'First Steps': weeks.slice(0, Math.ceil(weeks.length / 4)).flatMap(w => w.topics),
      'Core Concepts': weeks.slice(Math.ceil(weeks.length / 4), Math.ceil(weeks.length / 2)).flatMap(w => w.topics),
      'Interactivity': weeks.slice(Math.ceil(weeks.length / 2), Math.ceil(3 * weeks.length / 4)).flatMap(w => w.topics),
      'Advanced': weeks.slice(Math.ceil(3 * weeks.length / 4)).flatMap(w => w.topics)
    };

    return {
      status: true,
      text: {
        query: request.topic,
        chapters
      },
      tree: [{
        name: request.topic,
        children: Object.entries(chapters).map(([name, topics]) => ({
          name,
          children: topics.map(topic => ({ name: topic }))
        }))
      }],
      roadmapId,
      metadata: {
        generated: `Fallback ${request.topic} Roadmap`,
        summary: `${request.duration_weeks} weeks, ${request.duration_weeks * 8} total hours`
      }
    };
  }

  private async processAndSaveRoadmapInBackground(aiResponse: any, request: IRoadmapRequest, startTime: number, userIp?: string, userAgent?: string): Promise<void> {
    try {
      const roadmapData = await this.processAndSaveRoadmap(aiResponse, request, startTime);
      await this.saveCompleteAIResponse(aiResponse, request, startTime);
      await this.logRoadmapHistory(roadmapData.roadmapId, request.user_id, 'generated', userIp, userAgent);
    } catch (error) {
      console.warn('Background roadmap saving failed:', error);
    }
  }

  private async processAndSaveRoadmap(aiResponse: any, request: IRoadmapRequest, startTime: number): Promise<IRoadmapData> {
    const generationTime = Date.now() - startTime;
    const roadmapId = aiResponse.roadmapId || uuidv4();

    // Extract roadmap data from AI response
    const roadmapData = this.extractRoadmapDataFromResponse(aiResponse);

    // Calculate total estimated hours from weeks
    const totalEstimatedHours = roadmapData.weeks.reduce((total: number, week: IWeek) => total + week.estimated_hours, 0);

    // Create and save roadmap document with logging
    const roadmap = await logDatabaseOperationWrapper(
      'create',
      'roadmaps',
      { roadmapId, topic: request.topic },
      async () => {
        const roadmap = new RoadmapModel({
          roadmapId,
          title: roadmapData.title,
          overview: roadmapData.overview,
          prerequisites: roadmapData.prerequisites || [],
          weeks: roadmapData.weeks || [],
          milestones: roadmapData.milestones || [],
          final_project: roadmapData.final_project || 'Complete the learning journey',
          next_steps: roadmapData.next_steps || [],
          
          // Request metadata
          topic: request.topic,
          skill_level: request.skill_level,
          duration_weeks: request.duration_weeks,
          focus_areas: request.focus_areas,
          user_id: request.user_id,
          
          // Generation metadata
          ai_model_used: 'cohere-command-r-plus',
          generation_time_ms: generationTime,
          total_estimated_hours: totalEstimatedHours,
          status: 'generated'
        });

        return await roadmap.save();
      }
    );
    
    // Log successful save
    roadmapLogger.info('Roadmap saved successfully', {
      roadmapId,
      topic: request.topic,
      skill_level: request.skill_level,
      duration_weeks: request.duration_weeks,
      total_hours: totalEstimatedHours,
      chapters_count: Object.keys(aiResponse.text?.chapters || {}).length,
      tree_nodes: aiResponse.tree?.length || 0,
      weeks_count: roadmapData.weeks.length,
      milestones_count: roadmapData.milestones.length
    });
    
    return roadmap;
  }

  private async saveCompleteAIResponse(aiResponse: any, request: IRoadmapRequest, startTime: number): Promise<void> {
    const roadmapId = aiResponse.roadmapId || uuidv4();
    
    await logDatabaseOperationWrapper(
      'create',
      'roadmapresponses',
      { roadmapId },
      async () => {
        const generationTime = Date.now() - startTime;

        // Save the complete AI response for analytics and debugging
        const responseData = new RoadmapResponseModel({
          roadmapId,
          status: aiResponse.status,
          text: aiResponse.text,
          tree: aiResponse.tree,
          metadata: aiResponse.metadata,
          original_request: {
            topic: request.topic,
            skill_level: request.skill_level,
            duration_weeks: request.duration_weeks,
            focus_areas: request.focus_areas,
            user_id: request.user_id
          },
          generation_time_ms: generationTime,
          ai_model_used: 'cohere-command-r-plus'
        });

        const saved = await responseData.save();
        
        roadmapLogger.info('Complete AI response saved', {
          roadmapId,
          topic: request.topic,
          response_size: JSON.stringify(aiResponse).length,
          chapters_count: Object.keys(aiResponse.text?.chapters || {}).length
        });
        
        return saved;
      }
    ).catch(error => {
      roadmapLogger.warn('Failed to save complete AI response', {
        roadmapId,
        error: error.message
      });
      // Don't throw error for this optional save
    });
  }

  private extractRoadmapDataFromResponse(aiResponse: any): any {
    // Extract comprehensive data from the AI response
    const chapters = aiResponse.text?.chapters || {};
    const metadata = aiResponse.metadata || {};
    
    // Convert chapters to weeks structure
    const weeks: IWeek[] = [];
    let weekCounter = 1;
    
    Object.entries(chapters).forEach(([chapterName, topics]: [string, any]) => {
      if (Array.isArray(topics)) {
        topics.forEach((topic: string, index: number) => {
          weeks.push({
            week: weekCounter,
            title: `Week ${weekCounter}: ${topic}`,
            objectives: [`Master ${topic}`, `Apply ${topic} concepts`],
            topics: [topic],
            resources: ['Official documentation', 'Online tutorials', 'Practice exercises'],
            projects: [`${topic} hands-on project`],
            estimated_hours: 8
          });
          weekCounter++;
        });
      }
    });

    // Generate milestones based on chapters
    const milestones: IMilestone[] = [];
    const chapterNames = Object.keys(chapters);
    chapterNames.forEach((chapterName, index) => {
      const weekNumber = Math.floor((weeks.length / chapterNames.length) * (index + 1));
      milestones.push({
        week: Math.max(1, weekNumber),
        milestone: `${chapterName} Completed`,
        deliverable: `Mastery of ${chapterName} concepts`
      });
    });

    return {
      title: metadata.generated || `Learning Roadmap for ${aiResponse.text?.query || 'Unknown Topic'}`,
      overview: `Comprehensive learning roadmap for ${aiResponse.text?.query || 'the selected topic'} covering ${Object.keys(chapters).join(', ')}`,
      prerequisites: ['Basic computer skills', 'Internet access', 'Dedication to learning'],
      weeks,
      milestones,
      final_project: `Complete ${aiResponse.text?.query || 'learning'} capstone project`,
      next_steps: [
        'Apply learned concepts in real projects',
        'Join relevant communities',
        'Continue advanced learning',
        'Share knowledge with others'
      ]
    };
  }

  private formatRoadmapResponse(roadmap: IRoadmapData): IRoadmapResponse {
    // Create chapters for frontend visualization
    const totalWeeks = roadmap.weeks.length;
    const phaseSize = Math.max(1, Math.floor(totalWeeks / 4));
    
    const chapters: Record<string, string[]> = {
      'First Steps': [],
      'Core Concepts': [],
      'Interactivity': [],
      'Advanced': []
    };

    roadmap.weeks.forEach((week, index) => {
      const phase = index < phaseSize ? 'First Steps' :
                   index < 2 * phaseSize ? 'Core Concepts' :
                   index < 3 * phaseSize ? 'Interactivity' : 'Advanced';
      if (chapters[phase]) {
        chapters[phase].push(...week.topics);
      }
    });

    // Create tree structure
    const tree: ITreeNode[] = [{
      name: roadmap.topic,
      children: Object.entries(chapters).map(([name, topics]) => ({
        name,
        children: topics.map(topic => ({ name: topic }))
      }))
    }];

    // Return the exact same structure as Python AI service
    return {
      status: true,
      text: {
        query: roadmap.topic,
        chapters
      },
      tree,
      roadmapId: roadmap.roadmapId,
      metadata: {
        generated: roadmap.title,
        summary: `${roadmap.duration_weeks} weeks, ${roadmap.total_estimated_hours || 0} total hours`
      }
    };
  }

  private async logRoadmapHistory(
    roadmapId: string, 
    userId?: string, 
    action: 'generated' | 'viewed' | 'started' | 'week_completed' | 'milestone_reached' | 'completed' | 'archived' = 'viewed',
    userIp?: string,
    userAgent?: string,
    additionalData?: any
  ): Promise<void> {
    try {
      await RoadmapHistoryModel.create({
        roadmapId,
        user_id: userId,
        action,
        ip_address: userIp,
        user_agent: userAgent,
        ...additionalData
      });
    } catch (error) {
      console.warn('Failed to log roadmap history:', error);
      // Don't throw error for logging failures
    }
  }
}
