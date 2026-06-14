import { Controller, BadRequestException, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { RoadmapService } from './roadmap.service';
import { DailyUsageLimitService } from '../usage/daily-usage-limit.service.refactored';
import { AiCreditService } from '../../ai-usage/ai-credit.service';

@Controller()
export class RoadmapController {
  private readonly logger = new Logger(RoadmapController.name);

  constructor(
    private readonly roadmapService: RoadmapService,
    private readonly dailyUsageLimitService: DailyUsageLimitService,
    private readonly aiCreditService: AiCreditService,
  ) { }

  @MessagePattern({ cmd: 'lms.ai.roadmap.generate' })
  async generateRoadmap(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const {
      userId,
      role,
      plan,
      ip = '',
      userAgent = '',
      idempotency_key,
      ...generateRoadmapDto
    } = data;
    const request = { ...generateRoadmapDto, userId };

    this.logger.log(
      `Received roadmap generation request for topic: "${request.topic}", user: ${userId}`,
    );

    return this.aiCreditService.executeWithCredits(
      userId,
      'ROADMAP_GENERATION',
      idempotency_key,
      () => this.roadmapService.generateRoadmap(
        request,
        ip,
        userAgent,
      )
    );
  }

  @MessagePattern({ cmd: 'lms.ai.usage.me' })
  async getMyUsage(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { userId, role, plan } = data;
    return this.dailyUsageLimitService.getTodayUsage({ userId, role, plan });
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.health' })
  health(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    return {
      success: true,
      message: 'Roadmap service healthy',
      timestamp: new Date().toISOString(),
      service: 'roadmap',
      version: '1.0.0',
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.stats' })
  async getServiceStats(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const userId = data?.userId;
    const stats = await this.roadmapService.getServiceStats(userId);
    return {
      success: true,
      message: 'Service statistics retrieved successfully',
      data: stats,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.batchDelete' })
  async bulkDeleteRoadmaps(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { roadmap_ids, user_id } = data;
    const result = await this.roadmapService.bulkDeleteRoadmaps(
      roadmap_ids,
      user_id,
    );

    return {
      success: true,
      message: 'Bulk delete operation completed',
      data: {
        deleted_count: result.deleted,
        failed: result.failed_roadmap_ids,
      },
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.getQueryAnalytics' })
  async getQueryAnalytics(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { start_date, end_date, user_id } = data;
    const analytics = await this.roadmapService.getQueryAnalytics(
      start_date,
      end_date,
      user_id,
    );
    return {
      success: true,
      message: 'Query analytics retrieved successfully',
      data: analytics,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.testAiConnection' })
  async testAiConnection(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    const status = await this.roadmapService.testAiConnection();
    return {
      success: status.ok,
      message: status.message,
      endpoint: status.endpoint,
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.systemStatus' })
  async systemStatus(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    return this.roadmapService.getSystemStatus();
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.getById' })
  async getRoadmapById(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { roadmapId, userId, ip = '', userAgent = '' } = data;
    if (!roadmapId) {
      this.logger.warn('Get roadmap request missing roadmapId');
      throw new BadRequestException('Roadmap ID is required');
    }

    this.logger.log(
      `Received get roadmap request: ${roadmapId}${userId ? ` for user: ${userId}` : ''}`,
    );

    return this.roadmapService.getRoadmapById(roadmapId, userId, ip, userAgent);
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.updateProgress' })
  async updateProgress(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const {
      roadmapId,
      userId,
      week_number,
      milestone_week,
      progress_percentage,
      time_spent_minutes,
      notes,
      ip = '',
      userAgent = '',
    } = data;
    if (!userId) {
      this.logger.warn('Update progress request missing userId');
      throw new BadRequestException('User ID is required');
    }

    this.logger.log(
      `Received progress update request for roadmap: ${roadmapId}, user: ${userId}, progress: ${progress_percentage}%`,
    );

    await this.roadmapService.updateProgress(
      roadmapId,
      userId,
      week_number,
      milestone_week,
      progress_percentage,
      time_spent_minutes,
      notes,
      ip,
      userAgent,
    );

    return {
      success: true,
      message: 'Progress updated successfully',
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.delete' })
  async deleteRoadmap(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { roadmapId, userId } = data;
    if (!roadmapId || roadmapId.trim() === '') {
      this.logger.warn('Delete roadmap request missing roadmapId');
      throw new BadRequestException('Roadmap ID is required');
    }

    this.logger.log(
      `Received delete roadmap request: ${roadmapId}${userId ? ` for user: ${userId}` : ''}`,
    );

    const result = await this.roadmapService.deleteRoadmap(
      roadmapId.trim(),
      userId,
    );
    return result;
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.getHistory' })
  async getRoadmapHistory(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { roadmapId, page = '1', limit = '20' } = data;
    if (!roadmapId || roadmapId.trim() === '') {
      throw new BadRequestException('Roadmap ID is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const result = await this.roadmapService.getRoadmapHistory(
      roadmapId.trim(),
      pageNum,
      limitNum,
    );

    return {
      success: true,
      message: 'Roadmap history retrieved successfully',
      data: result,
    };
  }

  @MessagePattern({ cmd: 'lms.ai.roadmap.getUserRoadmaps' })
  async getUserRoadmaps(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { userId } = data;
    if (!userId || userId.trim() === '') {
      this.logger.warn('Get user roadmaps request missing userId');
      throw new BadRequestException('User ID is required');
    }

    this.logger.log(`Received get user roadmaps request for user: ${userId}`);

    const roadmaps = await this.roadmapService.getUserRoadmaps(userId.trim());

    this.logger.log(
      `Retrieved ${roadmaps.length} roadmaps for user: ${userId}`,
    );

    return {
      success: true,
      message: 'User roadmaps retrieved successfully',
      data: roadmaps,
    };
  }
}
