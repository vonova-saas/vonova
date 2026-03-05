import { Controller, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { NatsContext } from '@nestjs/microservices';
import { RoadmapService } from './roadmap.service';

@Controller()
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @MessagePattern({ cmd: 'lms.ai.roadmap.generate' })
  async generateRoadmap(@Payload() data: any, @Ctx() _ctx: NatsContext) {
    const { userId, ip = '', userAgent = '', ...generateRoadmapDto } = data;
    const request = { ...generateRoadmapDto, userId };
    return this.roadmapService.generateRoadmap(request, ip, userAgent);
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
  async getServiceStats(@Payload() _data: any, @Ctx() _ctx: NatsContext) {
    const stats = await this.roadmapService.getServiceStats();
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
      throw new BadRequestException('Roadmap ID is required');
    }
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
      throw new BadRequestException('User ID is required');
    }
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
      throw new BadRequestException('Roadmap ID is required');
    }

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
      throw new BadRequestException('User ID is required');
    }

    const roadmaps = await this.roadmapService.getUserRoadmaps(userId.trim());

    return {
      success: true,
      message: 'User roadmaps retrieved successfully',
      data: roadmaps,
    };
  }
}
