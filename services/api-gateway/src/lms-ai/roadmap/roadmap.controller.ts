import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoadmapGatewayService } from './roadmap.service';
import {
  GenerateRoadmapDto,
  UpdateRoadmapProgressDto,
  BulkDeleteRoadmapsDto,
} from './dto/roadmap.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Roadmap Generation AI')
@Controller('api/v1/roadmap')
@UseGuards(JwtAuthGuard)
export class RoadmapGatewayController {
  constructor(private readonly roadmapService: RoadmapGatewayService) { }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Roadmap service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return firstValueFrom(this.roadmapService.getHealth());
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics and metrics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getServiceStats() {
    return firstValueFrom(this.roadmapService.getServiceStats());
  }

  @Public()
  @Get('test-ai-connection')
  @ApiOperation({ summary: 'Test connectivity to roadmap AI service' })
  @ApiResponse({ status: 200, description: 'AI connectivity status' })
  async testAiConnection() {
    return firstValueFrom(this.roadmapService.testAiConnection());
  }

  @Public()
  @Get('system-status')
  @ApiOperation({ summary: 'Get roadmap module system status' })
  @ApiResponse({ status: 200, description: 'System status' })
  async getSystemStatus() {
    return firstValueFrom(this.roadmapService.getSystemStatus());
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new learning roadmap' })
  @ApiResponse({ status: 201, description: 'Roadmap generated successfully' })
  async generateRoadmap(
    @Body() generateRoadmapDto: GenerateRoadmapDto,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return firstValueFrom(
      this.roadmapService.generateRoadmap({
        ...generateRoadmapDto,
        userId: req.user._id,
        ip,
        userAgent,
      }),
    );
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Bulk delete multiple roadmaps' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete operation completed',
  })
  async bulkDeleteRoadmaps(
    @Body() bulkDeleteDto: BulkDeleteRoadmapsDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.roadmapService.bulkDeleteRoadmaps({
        ...bulkDeleteDto,
        user_id: req.user._id,
      }),
    );
  }

  @Get('analytics/queries')
  @ApiOperation({ summary: 'Get roadmap generation and usage analytics' })
  @ApiQuery({
    name: 'start_date',
    description: 'Start date (ISO 8601)',
    required: false,
  })
  @ApiQuery({
    name: 'end_date',
    description: 'End date (ISO 8601)',
    required: false,
  })
  @ApiQuery({
    name: 'user_id',
    description: 'Filter by user ID',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Query analytics retrieved successfully',
  })
  async getQueryAnalytics(
    @Request() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('user_id') userId?: string,
  ) {
    return firstValueFrom(
      this.roadmapService.getQueryAnalytics({
        start_date: startDate,
        end_date: endDate,
        user_id: userId || req.user._id,
      }),
    );
  }

  @Get(':roadmapId')
  @ApiOperation({ summary: 'Get roadmap by ID' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiQuery({
    name: 'user_id',
    description: 'Optional user identifier',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Roadmap retrieved successfully',
  })
  async getRoadmapById(
    @Param('roadmapId') roadmapId: string,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('user_id') userId?: string,
  ): Promise<any> {
    return firstValueFrom(
      this.roadmapService.getRoadmapById({
        roadmapId,
        userId: userId || req.user._id,
        ip,
        userAgent,
      }),
    );
  }

  @Put(':roadmapId/progress')
  @ApiOperation({ summary: 'Update roadmap progress' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  async updateProgress(
    @Param('roadmapId') roadmapId: string,
    @Body() updateProgressDto: UpdateRoadmapProgressDto,
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return firstValueFrom(
      this.roadmapService.updateProgress({
        roadmapId,
        userId: req.user._id,
        ...updateProgressDto,
        ip,
        userAgent,
      }),
    );
  }

  @Delete(':roadmapId')
  @ApiOperation({ summary: 'Delete roadmap and cleanup resources' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID to delete' })
  @ApiResponse({ status: 200, description: 'Roadmap deleted successfully' })
  async deleteRoadmap(
    @Param('roadmapId') roadmapId: string,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.roadmapService.deleteRoadmap({
        roadmapId,
        userId: req.user._id,
      }),
    );
  }

  @Get(':roadmapId/history')
  @ApiOperation({ summary: 'Get roadmap history' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Roadmap history retrieved successfully',
  })
  async getRoadmapHistory(
    @Param('roadmapId') roadmapId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.roadmapService.getRoadmapHistory({
        roadmapId,
        page,
        limit,
      }),
    );
  }

  @Get('user-roadmaps')
  @ApiOperation({ summary: 'Get all roadmaps for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User roadmaps retrieved successfully',
  })
  async getUserRoadmaps(@Request() req: any) {
    return firstValueFrom(
      this.roadmapService.getUserRoadmaps({
        userId: req.user._id,
      }),
    );
  }
}
