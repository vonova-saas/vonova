import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoadmapRepository } from '../database/repositories/roadmap.repository';
import { RoadmapHistoryRepository } from '../database/repositories/roadmap-history.repository';
import {
  IRoadmapRequest,
  IRoadmapResponse,
  IRoadmapData,
  IWeek,
  IMilestone,
} from './interfaces/roadmap.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);
  private readonly PYTHON_SERVICE_URL: string;
  private readonly FALLBACK_PYTHON_SERVICE_URL: string | undefined;
  private readonly DEFAULT_TIMEOUT = 300000; // 5 minutes timeout

  constructor(
    private readonly roadmapRepository: RoadmapRepository,
    private readonly roadmapHistoryRepository: RoadmapHistoryRepository,
    private readonly configService: ConfigService
  ) {
    const primary = this.configService.get('ROADMAP_AI_SERVICE_URL') || 'http://127.0.0.1:5000';
    const fallback = this.configService.get('FALLBACK_ROADMAP_AI_SERVICE_URL');
    this.PYTHON_SERVICE_URL = primary.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1');
    this.FALLBACK_PYTHON_SERVICE_URL = fallback ? fallback.replace('http://localhost', 'http://127.0.0.1').replace('https://localhost', 'https://127.0.0.1') : undefined;
  }

  async generateRoadmap(
    request: IRoadmapRequest,
    userIp?: string,
    userAgent?: string
  ): Promise<IRoadmapResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateRoadmapRequest(request);

      // Check for similar roadmaps
      const existingRoadmap = await this.findSimilarRoadmap(request);
      if (existingRoadmap && this.shouldUseCachedRoadmap(existingRoadmap, request)) {
        this.logger.log(`Using cached roadmap for topic: ${request.topic}`);
        return this.formatRoadmapResponse(existingRoadmap);
      }

      // Call AI service (Python endpoint is /generate-roadmap per service README)
      const aiResponse = await this.callPythonService('/generate-roadmap', request);

      // Process and save roadmap
      const roadmap = await this.processAndSaveRoadmap(aiResponse, request, startTime);

      // Log history
      await this.logRoadmapHistory(
        roadmap.roadmapId,
        request.userId,
        'generated',
        userIp,
        userAgent
      );

      return this.formatRoadmapResponse(roadmap);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error generating roadmap: ${err.message}`, err.stack);
      throw error;
    }
  }

  async getRoadmapById(
    roadmapId: string,
    userId?: string,
    userIp?: string,
    userAgent?: string
  ): Promise<IRoadmapResponse> {
    try {
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      // Log view history
      if (userId) {
        await this.logRoadmapHistory(roadmapId, userId, 'viewed', userIp, userAgent);
      }

      // Convert RoadmapDocument to IRoadmapData
      const roadmapData: IRoadmapData = {
        ...roadmap.toObject(),
        userId: roadmap.userId.toString()
      };
      return this.formatRoadmapResponse(roadmapData);
    } catch (error) {
      this.logger.error(`Error getting roadmap: ${error.message}`, error.stack);
      throw error;
    }
  }

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
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      // Update roadmap status if needed
      if (progressPercentage === 100) {
        await this.roadmapRepository.updateStatus(roadmapId, 'completed');
      } else if (progressPercentage && progressPercentage > 0) {
        await this.roadmapRepository.updateStatus(roadmapId, 'in_progress');
      }

      // Log progress history
      const action = progressPercentage === 100 ? 'completed' :
        weekNumber ? 'week_completed' :
          milestoneWeek ? 'milestone_reached' : 'started';

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
      this.logger.error(`Error updating progress: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods
  private validateRoadmapRequest(request: IRoadmapRequest): void {
    if (!request.topic || request.topic.trim() === '') {
      throw new BadRequestException('Topic is required');
    }

    if (!request.skill_level || !['beginner', 'intermediate', 'advanced'].includes(request.skill_level)) {
      throw new BadRequestException('Invalid skill level');
    }

    if (!request.duration_weeks || request.duration_weeks < 1 || request.duration_weeks > 52) {
      throw new BadRequestException('Duration must be between 1 and 52 weeks');
    }

    if (request.focus_areas && request.focus_areas.length > 10) {
      throw new BadRequestException('Maximum 10 focus areas allowed');
    }
  }

  private async findSimilarRoadmap(request: IRoadmapRequest): Promise<IRoadmapData | null> {
    const similar = await this.roadmapRepository.findSimilar(
      request.topic,
      request.skill_level,
      request.duration_weeks
    );

    return similar.length > 0 ? {
      ...similar[0].toObject(),
      userId: similar[0].userId.toString()
    } : null;
  }

  private shouldUseCachedRoadmap(existingRoadmap: IRoadmapData, request: IRoadmapRequest): boolean {
    // Use cached roadmap if it's similar enough
    return existingRoadmap.topic.toLowerCase() === request.topic.toLowerCase() &&
      existingRoadmap.skill_level === request.skill_level &&
      Math.abs(existingRoadmap.duration_weeks - request.duration_weeks) <= 2;
  }

  private async callPythonService(endpoint: string, data: object): Promise<Record<string, unknown>> {
    const url = `${this.PYTHON_SERVICE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new InternalServerErrorException(
          `Python service responded with status: ${response.status}, body: ${errorText}`,
        );
      }

      const responseData = (await response.json()) as Record<string, unknown>;
      if (responseData.status === false) {
        throw new InternalServerErrorException(
          (responseData.error as string) || (responseData.detail as string) || 'Python service returned error',
        );
      }
      return responseData;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error calling AI service: ${err.message}`, err.stack);

      if (this.FALLBACK_PYTHON_SERVICE_URL) {
        try {
          const fallbackUrl = `${this.FALLBACK_PYTHON_SERVICE_URL}${endpoint}`;
          this.logger.warn(`Retrying roadmap AI call against fallback: ${fallbackUrl}`);
          const retry = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
          });
          if (!retry.ok) {
            const text = await retry.text();
            throw new InternalServerErrorException(
              `Python service (fallback) responded with status: ${retry.status}, body: ${text}`,
            );
          }
          return (await retry.json()) as Record<string, unknown>;
        } catch (fallbackErr) {
          this.logger.error(
            `Fallback roadmap AI call failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
          );
        }
      }

      throw new InternalServerErrorException(`Failed to call Python service: ${err.message}`);
    }
  }

  private async processAndSaveRoadmap(
    aiResponse: Record<string, unknown>,
    request: IRoadmapRequest,
    startTime: number,
  ): Promise<IRoadmapData> {
    const roadmapId = uuidv4();

    const text = aiResponse.text as Record<string, unknown> | undefined;
    const metadata = aiResponse.metadata as Record<string, unknown> | undefined;
    const roadmapData = {
      roadmapId,
      title: (text?.query as string) || `Learning Path: ${request.topic}`,
      overview: (metadata?.summary as string) || 'AI-generated learning roadmap',
      prerequisites: [],
      weeks: this.extractWeeksFromResponse(aiResponse),
      milestones: this.extractMilestonesFromResponse(aiResponse),
      final_project: 'Complete the final project',
      next_steps: ['Continue learning', 'Apply knowledge in real projects'],
      topic: request.topic,
      skill_level: request.skill_level,
      duration_weeks: request.duration_weeks,
      focus_areas: request.focus_areas,
      userId: request.userId,
      ai_model_used: 'cohere-command-r-plus',
      generation_time_ms: Date.now() - startTime,
      status: 'generated' as const
    };

    return await this.roadmapRepository.create(roadmapData);
  }

  private extractWeeksFromResponse(aiResponse: Record<string, unknown>): IWeek[] {
    const weeks: IWeek[] = [];
    const text = aiResponse.text as Record<string, unknown> | undefined;
    const chapters = (text?.chapters as Record<string, unknown>) || {};

    Object.entries(chapters).forEach(([chapterName, rawTopics], index) => {
      const topics = Array.isArray(rawTopics) ? rawTopics : [rawTopics];
      weeks.push({
        week: index + 1,
        title: chapterName,
        objectives: [`Learn ${chapterName}`],
        topics: topics as string[],
        resources: [`${chapterName} documentation`, `${chapterName} tutorials`],
        projects: [`Build ${chapterName} project`],
        estimated_hours: 20
      });
    });

    return weeks;
  }

  private extractMilestonesFromResponse(aiResponse: Record<string, unknown>): IMilestone[] {
    // Extract milestones from AI response
    const milestones: IMilestone[] = [];
    const weeks = this.extractWeeksFromResponse(aiResponse);

    weeks.forEach((week, index) => {
      if ((index + 1) % 4 === 0) { // Every 4 weeks
        milestones.push({
          week: index + 1,
          milestone: `Complete ${week.title}`,
          deliverable: `${week.title} project`
        });
      }
    });

    return milestones;
  }

  private async logRoadmapHistory(
    roadmapId: string,
    userId: string,
    action: 'generated' | 'viewed' | 'started' | 'week_completed' | 'milestone_reached' | 'completed' | 'archived',
    userIp?: string,
    userAgent?: string,
    additionalData?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.roadmapHistoryRepository.create({
        roadmapId,
        userId,
        action,
        ip_address: userIp,
        user_agent: userAgent,
        metadata: additionalData,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.warn(`Failed to log roadmap history: ${error.message}`);
    }
  }

  private formatRoadmapResponse(roadmap: IRoadmapData): IRoadmapResponse {
    return {
      status: true,
      text: {
        query: roadmap.title,
        chapters: this.formatChaptersFromWeeks(roadmap.weeks)
      },
      tree: this.formatTreeFromWeeks(roadmap.weeks),
      roadmapId: roadmap.roadmapId,
      metadata: {
        generated: roadmap.created_at.toISOString(),
        summary: roadmap.overview
      },
      roadmap_data: roadmap
    };
  }

  private formatChaptersFromWeeks(weeks: IWeek[]): Record<string, string[]> {
    const chapters: Record<string, string[]> = {};
    weeks.forEach(week => {
      chapters[week.title] = week.topics;
    });
    return chapters;
  }

  private formatTreeFromWeeks(weeks: IWeek[]): { name: string; children: { name: string; children: { name: string }[] }[] }[] {
    return [
      {
        name: 'Learning Path',
        children: weeks.map((week) => ({
          name: week.title,
          children: week.topics.map((topic) => ({ name: topic })),
        })),
      },
    ];
  }

  // Health and status helpers used by controller endpoints
  async testAiConnection(): Promise<{ ok: boolean; message: string; endpoint: string }> {
    const endpoint = `${this.PYTHON_SERVICE_URL}/health`;
    try {
      const res = await fetch(endpoint, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        const txt = await res.text();
        return { ok: false, message: `AI service unhealthy: ${res.status} ${txt}`, endpoint };
      }
      return { ok: true, message: 'AI service reachable', endpoint };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      return { ok: false, message: `AI service not reachable: ${msg}`, endpoint };
    }
  }

  async getSystemStatus() {
    const ai = await this.testAiConnection();
    return {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        roadmap_ai: ai.ok ? 'healthy' : 'unhealthy',
      },
      details: {
        ai_endpoint: ai.endpoint,
        ai_message: ai.message
      }
    };
  }

  async deleteRoadmap(
    roadmapId: string,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Get roadmap from database to check ownership
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      // Optional: Check user ownership if userId provided
      if (userId && roadmap.userId && roadmap.userId !== userId) {
        throw new BadRequestException('You do not have permission to delete this roadmap');
      }

      // 2. Delete roadmap from database
      const roadmapDeleted = await this.roadmapRepository.deleteById(roadmapId);
      this.logger.log(`Roadmap deleted from database: ${roadmapDeleted}`);

      // 3. Delete history records
      const historyDeleted = await this.roadmapHistoryRepository.deleteByRoadmapId(roadmapId);
      this.logger.log(`History deleted from database: ${historyDeleted}`);

      return {
        success: true,
        message: 'Roadmap and all associated data deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Error deleting roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : '');
      throw error;
    }
  }

  async getRoadmapHistory(
    roadmapId: string,
    page: number,
    limit: number
  ): Promise<{
    history: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Verify roadmap exists
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        throw new BadRequestException('Roadmap not found');
      }

      return await this.roadmapHistoryRepository.findByRoadmapIdPaginated(roadmapId, page, limit);
    } catch (error) {
      this.logger.error(`Error getting roadmap history: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : '');
      throw error;
    }
  }

  async getServiceStats(): Promise<{
    total_roadmaps: number;
    total_generations: number;
    active_roadmaps: number;
    average_generation_time: number;
    roadmaps_by_status: Record<string, number>;
  }> {
    try {
      const [totalRoadmaps, totalGenerations, activeRoadmaps, avgGenerationTime, roadmapsByStatus] = await Promise.all([
        this.roadmapRepository.getTotalCount(),
        this.roadmapHistoryRepository.getTotalCount({ startDate: undefined, endDate: undefined }),
        this.roadmapRepository.getActiveRoadmapsCount(),
        this.roadmapRepository.getAverageGenerationTime(),
        this.roadmapRepository.getRoadmapsByStatus()
      ]);

      return {
        total_roadmaps: totalRoadmaps,
        total_generations: totalGenerations,
        active_roadmaps: activeRoadmaps,
        average_generation_time: Math.round(avgGenerationTime),
        roadmaps_by_status: roadmapsByStatus
      };
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return {
        total_roadmaps: 0,
        total_generations: 0,
        active_roadmaps: 0,
        average_generation_time: 0,
        roadmaps_by_status: {}
      };
    }
  }

  async bulkDeleteRoadmaps(
    roadmapIds: string[],
    userId?: string
  ): Promise<{
    total_requested: number;
    deleted: number;
    failed: number;
    failed_roadmap_ids: string[];
  }> {
    const results = {
      total_requested: roadmapIds.length,
      deleted: 0,
      failed: 0,
      failed_roadmap_ids: [] as string[]
    };

    for (const roadmapId of roadmapIds) {
      try {
        await this.deleteRoadmap(roadmapId, userId);
        results.deleted++;
      } catch (error) {
        results.failed++;
        results.failed_roadmap_ids.push(roadmapId);
        this.logger.warn(`Failed to delete roadmap ${roadmapId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  async getQueryAnalytics(
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Promise<{
    total_generations: number;
    popular_topics: Array<{ topic: string; count: number }>;
    skill_level_distribution: Record<string, number>;
    average_duration_weeks: number;
    completion_rate: number;
  }> {
    try {
      const filters: { userId?: string; startDate?: Date; endDate?: Date } = {};
      if (userId) {
        filters.userId = userId;
      }
      if (startDate) {
        filters.startDate = new Date(startDate);
      }
      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      const [
        totalGenerations,
        popularTopics,
        skillLevelDistribution,
        averageDuration,
        completionRate
      ] = await Promise.all([
        this.roadmapHistoryRepository.getTotalCount(filters),
        this.roadmapRepository.getPopularTopics(10),
        this.roadmapRepository.getSkillLevelDistribution(),
        this.roadmapRepository.getAverageDuration(),
        this.roadmapRepository.getCompletionRate()
      ]);

      return {
        total_generations: totalGenerations,
        popular_topics: popularTopics,
        skill_level_distribution: skillLevelDistribution,
        average_duration_weeks: Math.round(averageDuration * 10) / 10,
        completion_rate: Math.round(completionRate * 100) / 100
      };
    } catch (error) {
      this.logger.error('Error getting query analytics:', error);
      throw new InternalServerErrorException('Failed to retrieve query analytics');
    }
  }

  async getUserRoadmaps(userId: string): Promise<IRoadmapData[]> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const roadmaps = await this.roadmapRepository.findByUserId(userId);
      
      return roadmaps.map(roadmap => ({
        ...roadmap.toObject(),
        userId: roadmap.userId.toString(),
        roadmapId: roadmap.roadmapId,
        created_at: roadmap.created_at,
        updated_at: roadmap.updated_at
      }));
    } catch (error) {
      this.logger.error(`Error getting user roadmaps for userId ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve user roadmaps');
    }
  }
}
