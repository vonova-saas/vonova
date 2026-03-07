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
  IRoadmapHistory,
  SKILL_LEVEL_VALUES,
} from './interfaces/roadmap.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);
  private readonly PYTHON_SERVICE_URL: string;
  private readonly FALLBACK_PYTHON_SERVICE_URL: string | undefined;
  private readonly DEFAULT_TIMEOUT = 300_000; // 5 minutes

  constructor(
    private readonly roadmapRepository: RoadmapRepository,
    private readonly roadmapHistoryRepository: RoadmapHistoryRepository,
    private readonly configService: ConfigService,
  ) {
    const primary =
      this.configService.get('ROADMAP_AI_SERVICE_URL') ||
      'http://127.0.0.1:5000';
    const fallback = this.configService.get('FALLBACK_ROADMAP_AI_SERVICE_URL');

    // Normalize localhost -> 127.0.0.1 to avoid IPv6 (::1) issues on Windows/Postman
    this.PYTHON_SERVICE_URL = primary
      .replace('http://localhost', 'http://127.0.0.1')
      .replace('https://localhost', 'https://127.0.0.1');
    this.FALLBACK_PYTHON_SERVICE_URL = fallback
      ? fallback
        .replace('http://localhost', 'http://127.0.0.1')
        .replace('https://localhost', 'https://127.0.0.1')
      : undefined;

    this.logger.log(
      `Python service URL configured: ${this.PYTHON_SERVICE_URL}`,
    );
    if (this.FALLBACK_PYTHON_SERVICE_URL) {
      this.logger.log(
        `Fallback Python service URL configured: ${this.FALLBACK_PYTHON_SERVICE_URL}`,
      );
    }
  }

  async generateRoadmap(
    request: IRoadmapRequest,
    userIp?: string,
    userAgent?: string,
  ): Promise<IRoadmapResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Generating roadmap for topic: "${request.topic}", skill_level: ${request.skill_level}, duration_weeks: ${request.duration_weeks}, user_id: ${request.userId}`,
      );

      // Validate request
      this.validateRoadmapRequest(request);
      this.logger.log('Roadmap request validation passed');

      // Check for similar roadmaps
      this.logger.log('Checking for existing similar roadmaps');
      const existingRoadmap = await this.findSimilarRoadmap(request);
      if (
        existingRoadmap &&
        this.shouldUseCachedRoadmap(existingRoadmap, request)
      ) {
        this.logger.log(`Using cached roadmap for topic: ${request.topic}`);
        return this.formatRoadmapResponse(existingRoadmap);
      }
      this.logger.log(
        'No suitable cached roadmap found, proceeding with AI generation',
      );

      // Call AI service (Python endpoint is /generate-roadmap per service README)
      this.logger.log(
        `Calling Python AI service for roadmap generation: ${this.PYTHON_SERVICE_URL}/generate-roadmap`,
      );
      const aiResponse = await this.callPythonService(
        '/generate-roadmap',
        request,
      );
      this.logger.log('AI service response received successfully');

      // Process and save roadmap
      this.logger.log('Processing and saving roadmap to database');
      const roadmap = await this.processAndSaveRoadmap(
        aiResponse,
        request,
        startTime,
      );
      this.logger.log(
        `Roadmap saved successfully with ID: ${roadmap.roadmapId}`,
      );

      // Log history
      await this.logRoadmapHistory(
        roadmap.roadmapId,
        request.userId,
        'generated',
        userIp,
        userAgent,
      );

      const generationTime = Date.now() - startTime;
      this.logger.log(
        `Roadmap generation completed in ${generationTime}ms for topic: "${request.topic}"`,
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
    userAgent?: string,
  ): Promise<IRoadmapResponse> {
    try {
      this.logger.log(
        `Fetching roadmap by ID: ${roadmapId}${userId ? ` for user: ${userId}` : ''}`,
      );
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        this.logger.warn(`Roadmap not found: ${roadmapId}`);
        throw new BadRequestException('Roadmap not found');
      }

      this.logger.log(`Roadmap found: ${roadmapId}, title: "${roadmap.title}"`);

      // Log view history
      if (userId) {
        await this.logRoadmapHistory(
          roadmapId,
          userId,
          'viewed',
          userIp,
          userAgent,
        );
      }

      // Convert RoadmapDocument to IRoadmapData
      const roadmapData: IRoadmapData = {
        ...roadmap.toObject(),
        userId: roadmap.userId.toString(),
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
    userAgent?: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Updating progress for roadmap: ${roadmapId}, user: ${userId}, progress: ${progressPercentage}%`,
      );
      const roadmap = await this.roadmapRepository.findById(roadmapId);

      if (!roadmap) {
        this.logger.warn(`Roadmap not found for progress update: ${roadmapId}`);
        throw new BadRequestException('Roadmap not found');
      }

      // Update roadmap status if needed
      if (progressPercentage === 100) {
        await this.roadmapRepository.updateStatus(roadmapId, 'completed');
        this.logger.log(`Roadmap marked as completed: ${roadmapId}`);
      } else if (progressPercentage && progressPercentage > 0) {
        await this.roadmapRepository.updateStatus(roadmapId, 'in_progress');
        this.logger.log(`Roadmap marked as in progress: ${roadmapId}`);
      }

      // Log progress history
      const action =
        progressPercentage === 100
          ? 'completed'
          : weekNumber
            ? 'week_completed'
            : milestoneWeek
              ? 'milestone_reached'
              : 'started';

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
          notes,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error updating progress: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Private helper methods
  private validateRoadmapRequest(request: IRoadmapRequest): void {
    if (!request.topic || request.topic.trim() === '') {
      throw new BadRequestException('Topic is required');
    }

    if (
      !request.skill_level ||
      !SKILL_LEVEL_VALUES.includes(request.skill_level)
    ) {
      throw new BadRequestException(
        `skill_level must be one of the following values: ${SKILL_LEVEL_VALUES.join(', ')}`,
      );
    }

    if (
      !request.duration_weeks ||
      request.duration_weeks < 1 ||
      request.duration_weeks > 52
    ) {
      throw new BadRequestException('Duration must be between 1 and 52 weeks');
    }

    if (request.focus_areas && request.focus_areas.length > 10) {
      throw new BadRequestException('Maximum 10 focus areas allowed');
    }
  }

  private async findSimilarRoadmap(
    request: IRoadmapRequest,
  ): Promise<IRoadmapData | null> {
    const similar = await this.roadmapRepository.findSimilar(
      request.topic,
      request.skill_level,
      request.duration_weeks,
      request.userId,
    );

    return similar.length > 0
      ? {
        ...similar[0].toObject(),
        userId: similar[0].userId.toString(),
      }
      : null;
  }

  private shouldUseCachedRoadmap(
    existingRoadmap: IRoadmapData,
    request: IRoadmapRequest,
  ): boolean {
    // Only use cached roadmap if it belongs to the same user and is similar enough
    if (existingRoadmap.userId !== request.userId) return false;
    return (
      existingRoadmap.topic.toLowerCase() === request.topic.toLowerCase() &&
      existingRoadmap.skill_level === request.skill_level &&
      Math.abs(existingRoadmap.duration_weeks - request.duration_weeks) <= 2
    );
  }

  private async callPythonService(
    endpoint: string,
    data: object,
  ): Promise<Record<string, unknown>> {
    const url = `${this.PYTHON_SERVICE_URL}${endpoint}`;
    try {
      this.logger.log(`Calling Python service: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Python service responded with status: ${response.status}, body: ${errorText}`,
        );
        throw new InternalServerErrorException(
          `Python service responded with status: ${response.status}, body: ${errorText}`,
        );
      }

      const responseData: Record<string, unknown> = await response.json();
      if (responseData.status === false) {
        const errorMessage =
          (responseData.error as string) ||
          (responseData.detail as string) ||
          'Python service returned error';
        this.logger.error(`Python service returned error: ${errorMessage}`);
        throw new InternalServerErrorException(errorMessage);
      }
      this.logger.log('Python service call successful');
      return responseData;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error calling AI service: ${err.message}`, err.stack);

      if (this.FALLBACK_PYTHON_SERVICE_URL) {
        try {
          const fallbackUrl = `${this.FALLBACK_PYTHON_SERVICE_URL}${endpoint}`;
          this.logger.warn(
            `Retrying roadmap AI call against fallback: ${fallbackUrl}`,
          );
          const retry = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT),
          });
          if (!retry.ok) {
            const text = await retry.text();
            throw new InternalServerErrorException(
              `Python service (fallback) responded with status: ${retry.status}, body: ${text}`,
            );
          }
          const fallbackResponse: Record<string, unknown> = await retry.json();
          return fallbackResponse;
        } catch (fallbackErr) {
          this.logger.error(
            `Fallback roadmap AI call failed: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
          );
        }
      }

      throw new InternalServerErrorException(
        `Failed to call Python service: ${err.message}`,
      );
    }
  }

  private async processAndSaveRoadmap(
    aiResponse: Record<string, unknown>,
    request: IRoadmapRequest,
    startTime: number,
  ): Promise<IRoadmapData> {
    const roadmapId = uuidv4();
    this.logger.log(
      `Processing AI response for new roadmap with ID: ${roadmapId}`,
    );

    const text = aiResponse.text as Record<string, unknown> | undefined;
    const metadata = aiResponse.metadata as Record<string, unknown> | undefined;
    const queryText = text?.query as string | undefined;
    const summaryText = metadata?.summary as string | undefined;

    const weeks = this.extractWeeksFromResponse(aiResponse);
    this.logger.log(`Extracted ${weeks.length} weeks from AI response`);

    const roadmapData: IRoadmapData = {
      roadmapId,
      title: queryText || `Learning Path: ${request.topic}`,
      overview: summaryText || 'AI-generated learning roadmap',
      prerequisites: [],
      weeks: weeks,
      milestones: this.extractMilestonesFromResponse(aiResponse),
      final_project: 'Complete the final project',
      next_steps: ['Continue learning', 'Apply knowledge in real projects'],
      topic: request.topic,
      skill_level: request.skill_level,
      duration_weeks: request.duration_weeks,
      focus_areas: request.focus_areas,
      userId: request.userId,
      created_at: new Date(),
      updated_at: new Date(),
      ai_model_used: 'cohere-command-r-plus',
      generation_time_ms: Date.now() - startTime,
      total_estimated_hours: this.calculateTotalHours(weeks),
      status: 'generated' as const,
    };

    const savedRoadmap = await this.roadmapRepository.create(roadmapData);
    this.logger.log(
      `Roadmap saved to database: ${savedRoadmap.roadmapId}, title: "${savedRoadmap.title}"`,
    );
    return savedRoadmap;
  }

  private calculateTotalHours(weeks: IWeek[]): number {
    return weeks.reduce(
      (total, week) => total + (week.estimated_hours || 0),
      0,
    );
  }

  private extractWeeksFromResponse(
    aiResponse: Record<string, unknown>,
  ): IWeek[] {
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
        estimated_hours: 20,
      });
    });

    return weeks;
  }

  private extractMilestonesFromResponse(
    aiResponse: Record<string, unknown>,
  ): IMilestone[] {
    // Extract milestones from AI response
    const milestones: IMilestone[] = [];
    const weeks = this.extractWeeksFromResponse(aiResponse);

    weeks.forEach((week, index) => {
      if ((index + 1) % 4 === 0) {
        // Every 4 weeks
        milestones.push({
          week: index + 1,
          milestone: `Complete ${week.title}`,
          deliverable: `${week.title} project`,
        });
      }
    });

    return milestones;
  }

  private async logRoadmapHistory(
    roadmapId: string,
    userId: string,
    action:
      | 'generated'
      | 'viewed'
      | 'started'
      | 'week_completed'
      | 'milestone_reached'
      | 'completed'
      | 'archived',
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
        timestamp: new Date(),
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
        chapters: this.formatChaptersFromWeeks(roadmap.weeks),
      },
      tree: this.formatTreeFromWeeks(roadmap.weeks),
      roadmapId: roadmap.roadmapId,
      metadata: {
        generated: roadmap.created_at.toISOString(),
        summary: roadmap.overview,
      },
      roadmap_data: roadmap,
    };
  }

  private formatChaptersFromWeeks(weeks: IWeek[]): Record<string, string[]> {
    const chapters: Record<string, string[]> = {};
    weeks.forEach((week) => {
      chapters[week.title] = week.topics;
    });
    return chapters;
  }

  private formatTreeFromWeeks(weeks: IWeek[]): {
    name: string;
    children: { name: string; children: { name: string }[] }[];
  }[] {
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
  async testAiConnection(): Promise<{
    ok: boolean;
    message: string;
    endpoint: string;
  }> {
    const endpoint = `${this.PYTHON_SERVICE_URL}/health`;
    this.logger.log(`Testing AI service connection: ${endpoint}`);

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        const txt = await res.text();
        this.logger.error(
          `AI service health check failed: ${res.status} ${txt}`,
        );
        return {
          ok: false,
          message: `AI service unhealthy: ${res.status} ${txt}`,
          endpoint,
        };
      }
      this.logger.log('AI service health check successful');
      return { ok: true, message: 'AI service reachable', endpoint };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      this.logger.error(`AI service health check error: ${msg}`);
      return {
        ok: false,
        message: `AI service not reachable: ${msg}`,
        endpoint,
      };
    }
  }

  async getSystemStatus() {
    this.logger.log('Fetching system status');

    const ai = await this.testAiConnection();
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        roadmap_ai: ai.ok ? 'healthy' : 'unhealthy',
      },
      details: {
        ai_endpoint: ai.endpoint,
        ai_message: ai.message,
      },
    };

    this.logger.log(
      `System status: roadmap_ai is ${status.services.roadmap_ai}`,
    );

    return status;
  }

  async deleteRoadmap(
    roadmapId: string,
    userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(
        `Deleting roadmap: ${roadmapId}${userId ? ` for user: ${userId}` : ''}`,
      );

      // 1. Get roadmap from database to check ownership
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        this.logger.warn(`Roadmap not found for deletion: ${roadmapId}`);
        throw new BadRequestException('Roadmap not found');
      }

      // Optional: Check user ownership if userId provided
      if (userId && roadmap.userId && roadmap.userId !== userId) {
        this.logger.warn(
          `User ${userId} attempted to delete roadmap owned by ${roadmap.userId}`,
        );
        throw new BadRequestException(
          'You do not have permission to delete this roadmap',
        );
      }

      // 2. Delete roadmap from database
      const roadmapDeleted = await this.roadmapRepository.deleteById(roadmapId);
      this.logger.log(`Roadmap deleted from database: ${roadmapDeleted}`);

      // 3. Delete history records
      const historyDeleted =
        await this.roadmapHistoryRepository.deleteByRoadmapId(roadmapId);
      this.logger.log(`History deleted from database: ${historyDeleted}`);

      return {
        success: true,
        message: 'Roadmap and all associated data deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error deleting roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  async getRoadmapHistory(
    roadmapId: string,
    page: number,
    limit: number,
  ): Promise<{
    history: IRoadmapHistory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(
        `Fetching roadmap history for: ${roadmapId}, page: ${page}, limit: ${limit}`,
      );

      // Verify roadmap exists
      const roadmap = await this.roadmapRepository.findById(roadmapId);
      if (!roadmap) {
        this.logger.warn(`Roadmap not found for history request: ${roadmapId}`);
        throw new BadRequestException('Roadmap not found');
      }

      const result =
        await this.roadmapHistoryRepository.findByRoadmapIdPaginated(
          roadmapId,
          page,
          limit,
        );

      this.logger.log(
        `Retrieved ${result.history.length} history records for roadmap: ${roadmapId}`,
      );

      // Transform RoadmapHistoryDocument[] to IRoadmapHistory[]
      return {
        ...result,
        history: result.history.map((item) => ({
          _id: item._id?.toString(),
          roadmapId: item.roadmapId,
          userId: item.userId,
          action: item.action,
          timestamp: item.timestamp,
          ip_address: item.ip_address,
          user_agent: item.user_agent,
          metadata: item.metadata,
          week_number: item.week_number,
          milestone_week: item.milestone_week,
          progress_percentage: item.progress_percentage,
          time_spent_minutes: item.time_spent_minutes,
          notes: item.notes,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting roadmap history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  async getServiceStats(userId?: string): Promise<{
    total_roadmaps: number;
    total_generations: number;
    active_roadmaps: number;
    average_generation_time: number;
    roadmaps_by_status: Record<string, number>;
  }> {
    try {
      this.logger.log(
        `Fetching service stats${userId ? ` for user: ${userId}` : ' for all users'}`,
      );

      const historyFilters = userId
        ? { userId, startDate: undefined, endDate: undefined }
        : { startDate: undefined, endDate: undefined };
      const [
        totalRoadmaps,
        totalGenerations,
        activeRoadmaps,
        avgGenerationTime,
        roadmapsByStatus,
      ] = await Promise.all([
        this.roadmapRepository.getTotalCount(userId ? { userId } : undefined),
        this.roadmapHistoryRepository.getTotalCount(historyFilters),
        this.roadmapRepository.getActiveRoadmapsCount(userId),
        this.roadmapRepository.getAverageGenerationTime(userId),
        this.roadmapRepository.getRoadmapsByStatus(userId),
      ]);

      const stats = {
        total_roadmaps: totalRoadmaps,
        total_generations: totalGenerations,
        active_roadmaps: activeRoadmaps,
        average_generation_time: Math.round(avgGenerationTime),
        roadmaps_by_status: roadmapsByStatus,
      };

      this.logger.log(
        `Service stats retrieved: ${stats.total_roadmaps} roadmaps, ${stats.active_roadmaps} active, avg time: ${stats.average_generation_time}ms`,
      );

      return stats;
    } catch (error) {
      this.logger.error('Error getting service stats:', error);
      return {
        total_roadmaps: 0,
        total_generations: 0,
        active_roadmaps: 0,
        average_generation_time: 0,
        roadmaps_by_status: {},
      };
    }
  }

  async bulkDeleteRoadmaps(
    roadmapIds: string[],
    userId?: string,
  ): Promise<{
    total_requested: number;
    deleted: number;
    failed: number;
    failed_roadmap_ids: string[];
  }> {
    this.logger.log(
      `Starting bulk delete operation for ${roadmapIds.length} roadmaps${userId ? ` for user: ${userId}` : ''}`,
    );

    const results = {
      total_requested: roadmapIds.length,
      deleted: 0,
      failed: 0,
      failed_roadmap_ids: [] as string[],
    };

    for (const roadmapId of roadmapIds) {
      try {
        await this.deleteRoadmap(roadmapId, userId);
        results.deleted++;
      } catch (error) {
        results.failed++;
        results.failed_roadmap_ids.push(roadmapId);
        this.logger.warn(
          `Failed to delete roadmap ${roadmapId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    this.logger.log(
      `Bulk delete completed: ${results.deleted} deleted, ${results.failed} failed out of ${results.total_requested} total`,
    );

    return results;
  }

  async getQueryAnalytics(
    startDate?: string,
    endDate?: string,
    userId?: string,
  ): Promise<{
    total_generations: number;
    popular_topics: Array<{ topic: string; count: number }>;
    skill_level_distribution: Record<string, number>;
    average_duration_weeks: number;
    completion_rate: number;
  }> {
    try {
      this.logger.log(
        `Fetching query analytics${userId ? ` for user: ${userId}` : ''}${startDate ? ` from ${startDate}` : ''}${endDate ? ` to ${endDate}` : ''}`,
      );

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
        completionRate,
      ] = await Promise.all([
        this.roadmapHistoryRepository.getTotalCount(filters),
        this.roadmapRepository.getPopularTopics(10),
        this.roadmapRepository.getSkillLevelDistribution(),
        this.roadmapRepository.getAverageDuration(),
        this.roadmapRepository.getCompletionRate(),
      ]);

      const analytics = {
        total_generations: totalGenerations,
        popular_topics: popularTopics,
        skill_level_distribution: skillLevelDistribution,
        average_duration_weeks: Math.round(averageDuration * 10) / 10,
        completion_rate: Math.round(completionRate * 100) / 100,
      };

      this.logger.log(
        `Analytics retrieved: ${analytics.total_generations} generations, avg duration: ${analytics.average_duration_weeks} weeks, completion rate: ${analytics.completion_rate}%`,
      );

      return analytics;
    } catch (error) {
      this.logger.error('Error getting query analytics:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve query analytics',
      );
    }
  }

  async getUserRoadmaps(userId: string): Promise<IRoadmapData[]> {
    try {
      if (!userId) {
        this.logger.warn('getUserRoadmaps called without userId');
        throw new BadRequestException('User ID is required');
      }

      this.logger.log(`Fetching roadmaps for user: ${userId}`);

      const roadmaps = await this.roadmapRepository.findByUserId(userId);

      this.logger.log(
        `Retrieved ${roadmaps.length} roadmaps for user: ${userId}`,
      );

      return roadmaps.map((roadmap) => ({
        ...roadmap.toObject(),
        userId: roadmap.userId.toString(),
        roadmapId: roadmap.roadmapId,
        created_at: roadmap.created_at,
        updated_at: roadmap.updated_at,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting user roadmaps for userId ${userId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user roadmaps',
      );
    }
  }
}
