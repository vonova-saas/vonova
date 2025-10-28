import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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

  @Get(':roadmapId/:userId')
  @ApiOperation({ summary: 'Get roadmap by ID' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Roadmap retrieved successfully',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Roadmap not found' })
  async getRoadmapById(
    @Param('roadmapId') roadmapId: string,
    @Param('userId') userId: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<IRoadmapResponse> {
    return this.roadmapService.getRoadmapById(roadmapId, userId, ip, userAgent);
  }

  @Put(':roadmapId/progress/:userId')
  @ApiOperation({ summary: 'Update roadmap progress' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Progress updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Roadmap not found' })
  async updateProgress(
    @Param('roadmapId') roadmapId: string,
    @Param('userId') userId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<{ success: boolean; message: string }> {
    await this.roadmapService.updateProgress(
      roadmapId,
      userId,
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

  @Get('health')
  @ApiOperation({ summary: 'Roadmap service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return {
      success: true,
      message: 'Roadmap service healthy',
      timestamp: new Date().toISOString()
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
}
