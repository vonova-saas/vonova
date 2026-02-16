import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RoadmapService } from './roadmap.service';
import { GenerateRoadmapDto, UpdateProgressDto } from './dto/roadmap.dto';
import { IRoadmapResponse } from './interfaces/roadmap.interface';
import { SignedContextGuard } from '../common/guards/signed-context.guard';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('Roadmap')
@Controller('roadmap')
@UseGuards(SignedContextGuard)
@UseInterceptors(LoggingInterceptor)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) { }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new learning roadmap' })
  @ApiResponse({
    status: 201,
    description: 'Roadmap generated successfully',
    type: Object
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateRoadmap(
    @Body() generateRoadmapDto: GenerateRoadmapDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<IRoadmapResponse> {
    const request = {
      ...generateRoadmapDto,
      userId: req.userId
    };

    return this.roadmapService.generateRoadmap(request, ip, userAgent);
  }

  // Static routes must come before dynamic routes to avoid conflicts
  @Get('health')
  @ApiOperation({ summary: 'Roadmap service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return {
      success: true,
      message: 'Roadmap service healthy',
      timestamp: new Date().toISOString(),
      service: 'roadmap',
      version: '1.0.0'
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Service statistics retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            total_roadmaps: { type: 'number', example: 150 },
            total_generations: { type: 'number', example: 1250 },
            active_roadmaps: { type: 'number', example: 45 },
            average_generation_time: { type: 'number', example: 850 },
            roadmaps_by_status: { type: 'object' }
          }
        }
      }
    }
  })
  async getServiceStats() {
    const stats = await this.roadmapService.getServiceStats();
    return {
      success: true,
      message: 'Service statistics retrieved successfully',
      data: stats
    };
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Bulk delete multiple roadmaps' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete operation completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Bulk delete operation completed' },
        data: {
          type: 'object',
          properties: {
            deleted_count: { type: 'number', example: 2 },
            failed: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async bulkDeleteRoadmaps(
    @Body() bulkDeleteDto: { roadmap_ids: string[]; user_id?: string }
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      deleted_count: number;
      failed: string[];
    };
  }> {
    const result = await this.roadmapService.bulkDeleteRoadmaps(
      bulkDeleteDto.roadmap_ids,
      bulkDeleteDto.user_id
    );

    return {
      success: true,
      message: 'Bulk delete operation completed',
      data: {
        deleted_count: result.deleted,
        failed: result.failed_roadmap_ids
      }
    };
  }

  @Get('analytics/queries')
  @ApiOperation({ summary: 'Get roadmap generation and usage analytics' })
  @ApiQuery({ name: 'start_date', description: 'Start date (ISO 8601)', required: false })
  @ApiQuery({ name: 'end_date', description: 'End date (ISO 8601)', required: false })
  @ApiQuery({ name: 'user_id', description: 'Filter by user ID', required: false })
  @ApiResponse({
    status: 200,
    description: 'Query analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Query analytics retrieved successfully' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueryAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('user_id') userId?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const analytics = await this.roadmapService.getQueryAnalytics(startDate, endDate, userId);
    return {
      success: true,
      message: 'Query analytics retrieved successfully',
      data: analytics
    };
  }

  @Get('test-ai-connection')
  @ApiOperation({ summary: 'Test connectivity to roadmap AI service' })
  @ApiResponse({ status: 200, description: 'AI connectivity status' })
  async testAiConnection() {
    const status = await this.roadmapService.testAiConnection();
    return {
      success: status.ok,
      message: status.message,
      endpoint: status.endpoint,
      timestamp: new Date().toISOString()
    };
  }

  @Get('system-status')
  @ApiOperation({ summary: 'Get roadmap module system status' })
  @ApiResponse({ status: 200, description: 'System status' })
  async systemStatus() {
    return this.roadmapService.getSystemStatus();
  }

  // Dynamic routes come after static routes
  @Get(':roadmapId')
  @ApiOperation({ summary: 'Get roadmap by ID' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiQuery({ name: 'user_id', description: 'Optional user identifier', required: false })
  @ApiResponse({
    status: 200,
    description: 'Roadmap retrieved successfully',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Roadmap not found' })
  async getRoadmapById(
    @Param('roadmapId') roadmapId: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('user_id') userId?: string
  ): Promise<IRoadmapResponse> {
    const effectiveUserId = userId || req.userId;
    return this.roadmapService.getRoadmapById(roadmapId, effectiveUserId, ip, userAgent);
  }

  @Put(':roadmapId/progress')
  @ApiOperation({ summary: 'Update roadmap progress' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiQuery({ name: 'user_id', description: 'Optional user identifier', required: false })
  @ApiResponse({
    status: 200,
    description: 'Progress updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Roadmap not found' })
  async updateProgress(
    @Param('roadmapId') roadmapId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('user_id') userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const effectiveUserId = userId || req.userId;
    if (!effectiveUserId) {
      throw new BadRequestException('User ID is required');
    }
    await this.roadmapService.updateProgress(
      roadmapId,
      effectiveUserId,
      updateProgressDto.week_number,
      updateProgressDto.milestone_week,
      updateProgressDto.progress_percentage,
      updateProgressDto.time_spent_minutes,
      updateProgressDto.notes,
      ip,
      userAgent
    );

    return {
      success: true,
      message: 'Progress updated successfully'
    };
  }

  @Delete(':roadmapId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete roadmap and cleanup resources' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID to delete' })
  @ApiQuery({ name: 'user_id', description: 'Optional user identifier for ownership validation', required: false })
  @ApiResponse({
    status: 200,
    description: 'Roadmap deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Roadmap and all associated data deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Roadmap not found or validation failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteRoadmap(
    @Param('roadmapId') roadmapId: string,
    @Query('user_id') userId?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!roadmapId || roadmapId.trim() === '') {
      throw new BadRequestException('Roadmap ID is required');
    }

    const result = await this.roadmapService.deleteRoadmap(roadmapId.trim(), userId);
    return result;
  }

  @Get(':roadmapId/history')
  @ApiOperation({ summary: 'Get roadmap history' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of items per page', required: false })
  @ApiResponse({
    status: 200,
    description: 'Roadmap history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Roadmap history retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            history: { type: 'array', items: { type: 'object' } },
            total: { type: 'number', example: 15 },
            page: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 1 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Roadmap not found' })
  async getRoadmapHistory(
    @Param('roadmapId') roadmapId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      history: any[];
      total: number;
      page: number;
      totalPages: number;
    };
  }> {
    if (!roadmapId || roadmapId.trim() === '') {
      throw new BadRequestException('Roadmap ID is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));

    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new BadRequestException('Invalid page or limit parameter');
    }

    const result = await this.roadmapService.getRoadmapHistory(roadmapId.trim(), pageNum, limitNum);

    return {
      success: true,
      message: 'Roadmap history retrieved successfully',
      data: result
    };
  }
}
