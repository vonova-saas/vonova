import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  Controller,
  Get,
  ServiceUnavailableException,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { BillingGatewayService } from './app/billing/billing.service';

@ApiTags('Gateway')
@Controller('api/v1')
export class AppController {
  private readonly planCache = new Map<
    string,
    { plan: 'free' | 'pro' | 'startup'; expiresAt: number }
  >();
  private static readonly PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    @Inject('NATS_SERVICE') private natsClient: ClientProxy,
    private readonly billingService: BillingGatewayService,
  ) {}
  private static readonly HEALTH_TIMEOUT_MS = 3000;

  private toSafeString(raw: unknown): string | undefined {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'string') return raw.trim() || undefined;
    if (
      typeof raw === 'number' ||
      typeof raw === 'boolean' ||
      typeof raw === 'bigint' ||
      typeof raw === 'symbol'
    ) {
      return String(raw).trim() || undefined;
    }
    if (typeof raw === 'object') {
      const maybeHex = (raw as { toHexString?: () => string }).toHexString?.();
      if (typeof maybeHex === 'string' && maybeHex.trim()) {
        return maybeHex.trim();
      }
      const s = (raw as { toString?: () => string }).toString?.();
      if (typeof s === 'string') {
        const trimmed = s.trim();
        if (trimmed && trimmed !== '[object Object]') {
          return trimmed;
        }
      }
      return undefined;
    }
    return undefined;
  }

  private getCurrentUserId(req: unknown): string | undefined {
    const r = req as
      | { user?: { _id?: unknown; id?: unknown; sub?: unknown } }
      | undefined;
    const raw = r?.user?.id ?? r?.user?.sub ?? r?.user?._id;
    return this.toSafeString(raw);
  }

  private getCurrentUserRole(req: unknown): string | undefined {
    const r = req as { user?: { role?: unknown } } | undefined;
    const raw = r?.user?.role;
    return this.toSafeString(raw);
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

  private async resolveStudentPlan(
    req: unknown,
  ): Promise<'free' | 'pro' | 'startup'> {
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
      this.toSafeString(
        r?.user?.plan ?? r?.user?.subscriptionPlan ?? r?.user?.billingPlan,
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
      const billing = (await firstValueFrom(
        this.billingService.findOne(userId),
      )) as {
        data?: { plan?: string };
      };
      const resolvedPlan = this.normalizePlan(billing?.data?.plan);
      this.planCache.set(userId, {
        plan: resolvedPlan,
        expiresAt: Date.now() + AppController.PLAN_CACHE_TTL_MS,
      });
      return resolvedPlan;
    } catch {
      return 'free';
    }
  }

  private async getServiceHealth(
    cmd: string,
    serviceName: string,
  ): Promise<unknown> {
    try {
      return await firstValueFrom(
        this.natsClient
          .send({ cmd }, {})
          .pipe(timeout(AppController.HEALTH_TIMEOUT_MS)),
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'No response from service';
      throw new ServiceUnavailableException(
        `${serviceName} health check failed: ${reason}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get gateway status' })
  @ApiResponse({ status: 200, description: 'Gateway is running' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'API Gateway Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregate health: returns a per-subsystem rollup the dashboard can poll.
   * Each subsystem check is bounded to {@link HEALTH_TIMEOUT_MS} so a slow
   * downstream never holds up the entire endpoint.
   */
  @Get('health')
  @ApiOperation({ summary: 'Aggregate gateway + downstream health' })
  async aggregateHealth(): Promise<object> {
    const safe = async (
      name: string,
      run: () => Promise<unknown>,
    ): Promise<{ name: string; ok: boolean; latencyMs: number; details?: unknown }> => {
      const start = Date.now();
      try {
        const details = await run();
        return { name, ok: true, latencyMs: Date.now() - start, details };
      } catch (err) {
        return {
          name,
          ok: false,
          latencyMs: Date.now() - start,
          details: err instanceof Error ? err.message : String(err),
        };
      }
    };

    const checks = await Promise.all([
      safe('nats:app', () =>
        firstValueFrom(
          this.natsClient
            .send({ cmd: 'getAppHealth' }, {})
            .pipe(timeout(AppController.HEALTH_TIMEOUT_MS)),
        ),
      ),
      safe('nats:lms', () =>
        firstValueFrom(
          this.natsClient
            .send({ cmd: 'getLmsHealth' }, {})
            .pipe(timeout(AppController.HEALTH_TIMEOUT_MS)),
        ),
      ),
      safe('s3', async () => {
        const hasBucket = !!process.env.AWS_S3_BUCKET_APP_COMM;
        return { configured: hasBucket };
      }),
      safe('socket', () => Promise.resolve({ namespace: '/community' })),
    ]);

    const ok = checks.every((c) => c.ok);
    return {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('me/usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get today's daily usage limits" })
  @ApiResponse({
    status: 200,
    description: "Today's usage returned successfully",
  })
  async getMyDailyUsage(@Request() req: unknown): Promise<unknown> {
    const userId = this.getCurrentUserId(req);
    const role = this.getCurrentUserRole(req);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    const plan = this.isStudentRole(role)
      ? await this.resolveStudentPlan(req)
      : 'pro';

    return firstValueFrom(
      this.natsClient.send({ cmd: 'lms.ai.usage.me' }, { userId, role, plan }),
    );
  }

  // Backend Services
  @Get('app/health')
  @ApiOperation({ summary: 'Get app service health' })
  @ApiResponse({ status: 200, description: 'App service is running' })
  async getAppHealth(): Promise<unknown> {
    return this.getServiceHealth('getAppHealth', 'App service');
  }

  @Get('lms/health')
  @ApiOperation({ summary: 'Get LMS service health' })
  @ApiResponse({ status: 200, description: 'LMS service is running' })
  async getLmsHealth(): Promise<unknown> {
    return this.getServiceHealth('getLmsHealth', 'LMS service');
  }

  @Get('lms-ai/health')
  @ApiOperation({ summary: 'Get LMS AI service health' })
  @ApiResponse({ status: 200, description: 'LMS AI service is running' })
  async getLmsAiHealth(): Promise<unknown> {
    return this.getServiceHealth('getLmsAiHealth', 'LMS AI service');
  }

  @Get('admin/health')
  @ApiOperation({ summary: 'Get admin service health' })
  @ApiResponse({ status: 200, description: 'Admin service is running' })
  getAdminHealth() {
    return this.natsClient.send({ cmd: 'app.health.check' }, {});
  }

  @Get('admin/info')
  @ApiOperation({ summary: 'Get admin service info' })
  @ApiResponse({ status: 200, description: 'Admin service info' })
  getAdminInfo() {
    return this.natsClient.send({ cmd: 'app.info' }, {});
  }
}
