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
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

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
import { BillingGatewayService } from '../../app/billing/billing.service';

@ApiTags('Roadmap Generation AI')
@Controller('api/v1/roadmap')
@UseGuards(JwtAuthGuard)
export class RoadmapGatewayController {
  private readonly planCache = new Map<
    string,
    { plan: 'free' | 'pro' | 'startup'; expiresAt: number }
  >();
  private static readonly PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly roadmapService: RoadmapGatewayService,
    private readonly billingService: BillingGatewayService,
  ) {}

  /** Resolve current user id from req.user (id, sub, or _id) consistently across all roadmap endpoints. */
  private getCurrentUserId(req: unknown): string | undefined {
    const r = req as
      | { user?: { _id?: unknown; id?: unknown; sub?: unknown } }
      | undefined;
    const raw = r?.user?.id ?? r?.user?.sub ?? r?.user?._id;
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'string') return raw.trim() || undefined;
    if (typeof raw === 'object' && raw !== null) {
      const maybeHex = (raw as { toHexString?: () => string }).toHexString?.();
      if (typeof maybeHex === 'string' && maybeHex.trim())
        return maybeHex.trim();
      const s = (raw as { toString?: () => string }).toString?.();
      if (typeof s === 'string') {
        const trimmed = s.trim();
        if (trimmed && trimmed !== '[object Object]') return trimmed;
      }
      return undefined;
    }
    if (
      typeof raw === 'number' ||
      typeof raw === 'boolean' ||
      typeof raw === 'bigint' ||
      typeof raw === 'symbol'
    ) {
      return String(raw).trim() || undefined;
    }
    return undefined;
  }

  private getCurrentUserRole(req: unknown): string | undefined {
    const r = req as { user?: { role?: unknown } } | undefined;
    const raw = r?.user?.role;
    if (raw === undefined || raw === null) return undefined;
    return String(raw).trim() || undefined;
  }

  private isStudentRole(role?: string): boolean {
    const normalized = String(role ?? '')
      .trim()
      .toLowerCase();
    return normalized === 'student' || normalized === 'student_user';
  }

  private normalizePlan(rawPlan?: string): 'free' | 'pro' | 'startup' {
    const normalized = String(rawPlan ?? '')
      .trim()
      .toLowerCase();
    if (normalized === 'pro' || normalized === 'startup') return normalized;
    if (normalized === 'basic' || normalized === 'free' || normalized === '')
      return 'free';
    return 'free';
  }

  private async resolveStudentPlan(req: unknown): Promise<'free' | 'pro' | 'startup'> {
    const r = req as
      | {
          user?: {
            _id?: unknown;
            id?: unknown;
            sub?: unknown;
            plan?: unknown;
            subscriptionPlan?: unknown;
            billingPlan?: unknown;
          };
        }
      | undefined;

    const localPlan = this.normalizePlan(
      String(
        r?.user?.plan ?? r?.user?.subscriptionPlan ?? r?.user?.billingPlan ?? '',
      ),
    );
    if (localPlan !== 'free') return localPlan;

    const userId = this.getCurrentUserId(req);
    if (!userId) return 'free';

    const cached = this.planCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.plan;
    }

    try {
      const billing = (await firstValueFrom(this.billingService.findOne(userId))) as {
        data?: { plan?: string };
      };
      const resolvedPlan = this.normalizePlan(billing?.data?.plan);
      this.planCache.set(userId, {
        plan: resolvedPlan,
        expiresAt: Date.now() + RoadmapGatewayController.PLAN_CACHE_TTL_MS,
      });
      return resolvedPlan;
    } catch {
      return 'free';
    }
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Roadmap service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return firstValueFrom(this.roadmapService.getHealth());
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get service statistics and metrics',
    description:
      "Returns roadmap statistics for the authenticated user. When authenticated, only that user's roadmaps and generations are counted.",
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getServiceStats(@Request() req: any) {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException(
        'Authentication required to retrieve roadmap statistics',
      );
    }
    return firstValueFrom(this.roadmapService.getServiceStats(userId));
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
  ) {
    const userId = this.getCurrentUserId(req);
    const role = this.getCurrentUserRole(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    const plan = this.isStudentRole(role)
      ? await this.resolveStudentPlan(req)
      : 'pro';
    const idempotency_key = randomUUID();
    return firstValueFrom(
      this.roadmapService.generateRoadmap({
        ...generateRoadmapDto,
        userId,
        role,
        plan,
        ip,
        idempotency_key,
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
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return firstValueFrom(
      this.roadmapService.bulkDeleteRoadmaps({
        ...bulkDeleteDto,
        user_id: userId,
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
  @ApiResponse({
    status: 200,
    description: 'Query analytics retrieved successfully',
  })
  async getQueryAnalytics(
    @Request() req: any,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const userId = this.getCurrentUserId(req);
    return firstValueFrom(
      this.roadmapService.getQueryAnalytics({
        start_date: startDate,
        end_date: endDate,
        user_id: userId,
      }),
    );
  }

  @Get('user-roadmaps')
  @ApiOperation({ summary: 'Get all roadmaps for a user' })
  @ApiResponse({
    status: 200,
    description: 'User roadmaps retrieved successfully',
  })
  async getUserRoadmaps(@Request() req: any) {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return firstValueFrom(
      this.roadmapService.getUserRoadmaps({
        userId,
      }),
    );
  }

  @Get(':roadmapId')
  @ApiOperation({ summary: 'Get roadmap by ID' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiResponse({
    status: 200,
    description: 'Roadmap retrieved successfully',
  })
  async getRoadmapById(
    @Param('roadmapId') roadmapId: string,
    @Request() req: any,
    @Ip() ip: string,
  ): Promise<any> {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return firstValueFrom(
      this.roadmapService.getRoadmapById({
        roadmapId,
        userId,
        ip,
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
  ) {
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return firstValueFrom(
      this.roadmapService.updateProgress({
        roadmapId,
        userId,
        ...updateProgressDto,
        ip,
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
    const userId = this.getCurrentUserId(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return firstValueFrom(
      this.roadmapService.deleteRoadmap({
        roadmapId,
        userId,
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
}
