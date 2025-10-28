import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoadmapRepository } from '../database/repositories/roadmap.repository';
import { RoadmapHistoryRepository } from '../database/repositories/roadmap-history.repository';
import { IRoadmapRequest, IRoadmapResponse, IRoadmapData } from './interfaces/roadmap.interface';
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
      this.logger.error(`Error generating roadmap: ${error.message}`, error.stack);
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

  private async callPythonService(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.PYTHON_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new InternalServerErrorException(`Python service responded with status: ${response.status}, body: ${errorText}`);
      }

      const responseData = await response.json();

      if (responseData.status === false) {
        throw new InternalServerErrorException(responseData.error || responseData.detail || 'Python service returned error');
      }

      return responseData;
    } catch (error) {
      this.logger.error(`Error calling AI service: ${error.message}`, error.stack);

      // Optional single retry against fallback URL if provided
      const primary = this.PYTHON_SERVICE_URL;
      const hasFallback = Boolean(this.FALLBACK_PYTHON_SERVICE_URL);
      if (hasFallback && !`${this.FALLBACK_PYTHON_SERVICE_URL}${endpoint}`.startsWith(primary)) {
        try {
          const fallbackUrl = `${this.FALLBACK_PYTHON_SERVICE_URL}${endpoint}` as string;
          this.logger.warn(`Retrying roadmap AI call against fallback: ${fallbackUrl}`);
          const retry = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.DEFAULT_TIMEOUT)
          });
          if (!retry.ok) {
            const text = await retry.text();
            throw new InternalServerErrorException(`Python service (fallback) responded with status: ${retry.status}, body: ${text}`);
          }
          return await retry.json();
        } catch (fallbackErr) {
          this.logger.error(`Fallback roadmap AI call failed: ${fallbackErr.message}`);
        }
      }

      throw new InternalServerErrorException(`Failed to call Python service: ${error.message}`);
    }
  }

  private async processAndSaveRoadmap(
    aiResponse: any,
    request: IRoadmapRequest,
    startTime: number
  ): Promise<IRoadmapData> {
    const roadmapId = uuidv4();

    const roadmapData = {
      roadmapId,
      title: aiResponse.text?.query || `Learning Path: ${request.topic}`,
      overview: aiResponse.metadata?.summary || 'AI-generated learning roadmap',
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

  private extractWeeksFromResponse(aiResponse: any): any[] {
    // Extract weeks from AI response
    // This is a simplified version - you'll need to adapt based on your AI response format
    const weeks = [];
    const chapters = aiResponse.text?.chapters || {};

    Object.entries(chapters).forEach(([chapterName, topics]: [string, any], index) => {
      weeks.push({
        week: index + 1,
        title: chapterName,
        objectives: [`Learn ${chapterName}`],
        topics: Array.isArray(topics) ? topics : [topics],
        resources: [`${chapterName} documentation`, `${chapterName} tutorials`],
        projects: [`Build ${chapterName} project`],
        estimated_hours: 20
      });
    });

    return weeks;
  }

  private extractMilestonesFromResponse(aiResponse: any): any[] {
    // Extract milestones from AI response
    const milestones = [];
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
    additionalData?: any
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

  private formatChaptersFromWeeks(weeks: any[]): Record<string, string[]> {
    const chapters: Record<string, string[]> = {};
    weeks.forEach(week => {
      chapters[week.title] = week.topics;
    });
    return chapters;
  }

  private formatTreeFromWeeks(weeks: any[]): any[] {
    return [{
      name: 'Learning Path',
      children: weeks.map(week => ({
        name: week.title,
        children: week.topics.map((topic: string) => ({ name: topic }))
      }))
    }];
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
    } catch (e: any) {
      return { ok: false, message: `AI service not reachable: ${e?.message || 'unknown error'}`, endpoint };
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
}
