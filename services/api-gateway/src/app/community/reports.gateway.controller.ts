import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RateLimit,
  RateLimitGuard,
} from '../../common/guards/rate-limit.guard';
import { resolveRequesterUserId } from '../../common/utils/request-user-id';
import { CommunitySocialGatewayService } from './social.gateway.service';
import { CommunitySocketGateway } from '../../community/socket/community.gateway';
import { SOCKET_EVENTS } from '../../community/socket/socket-user.types';
import {
  ApplyReportActionDto,
  CreateContentReportDto,
  UpdateReportStatusDto,
} from './dto/reports.dto';

@ApiTags('Community Reports')
@ApiBearerAuth()
@Controller('api/v1/community')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class ReportsGatewayController {
  constructor(
    private readonly social: CommunitySocialGatewayService,
    private readonly sockets: CommunitySocketGateway,
  ) {}

  private requireUserId(req: ExpressRequest): string {
    const id = resolveRequesterUserId(req);
    if (!id) throw new UnauthorizedException('Authentication required');
    return id;
  }

  @Post('reports')
  @RateLimit({ limit: 10, windowMs: 60_000, bucket: 'community:reports' })
  @ApiOperation({ summary: 'Submit a content report' })
  async createReport(
    @Request() req: ExpressRequest,
    @Body() body: CreateContentReportDto,
  ) {
    const reporterId = this.requireUserId(req);
    const res = await firstValueFrom(
      this.social.createContentReport({
        reporterId,
        ...body,
      }),
    );
    return { success: true, message: 'Report submitted', data: res };
  }

  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  @ApiOperation({ summary: 'List moderation reports (admin)' })
  async listReports(
    @Query()
    query: {
      status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
      targetType?: string;
      search?: string;
      page?: number;
      limit?: number;
      sort?: 'newest' | 'oldest' | 'score';
    },
  ) {
    const res = await firstValueFrom(this.social.adminListReports(query));
    const data =
      res && typeof res === 'object' && 'data' in res
        ? (res as { data: unknown }).data
        : res;
    return { success: true, message: 'Reports loaded', data };
  }

  @Get('admin/reports/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  async getReport(@Param('id') id: string) {
    const data = await firstValueFrom(this.social.adminGetReport(id));
    return { success: true, message: 'Report loaded', data };
  }

  @Patch('admin/reports/:id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  async updateStatus(
    @Request() req: ExpressRequest,
    @Param('id') id: string,
    @Body() body: UpdateReportStatusDto,
  ) {
    const moderatorId = this.requireUserId(req);
    const data = await firstValueFrom(
      this.social.adminUpdateReportStatus(id, moderatorId, body.status),
    );
    this.sockets.broadcast(SOCKET_EVENTS.MODERATION_REPORT_UPDATED, {
      reportId: id,
      status: body.status,
    });
    return { success: true, message: 'Status updated', data };
  }

  @Patch('admin/reports/:id/action')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'admin')
  async applyAction(
    @Request() req: ExpressRequest,
    @Param('id') id: string,
    @Body() body: ApplyReportActionDto,
  ) {
    const moderatorId = this.requireUserId(req);
    const res = (await firstValueFrom(
      this.social.adminApplyReportAction(
        id,
        moderatorId,
        body.action,
        body.notes,
      ),
    )) as {
      data?: {
        socketPayload?: Record<string, unknown>;
        targetUserId?: string | null;
      };
    };
    const payload = res?.data?.socketPayload;
    if (payload?.event === 'CONTENT_REMOVED') {
      const targetType = String(payload.targetType ?? '');
      if (targetType === 'MESSAGE') {
        this.sockets.emitToGroup(
          String((payload as { groupId?: string }).groupId ?? ''),
          SOCKET_EVENTS.MESSAGE_REMOVED,
          payload,
        );
      } else {
        this.sockets.broadcast(SOCKET_EVENTS.CONTENT_REMOVED, payload);
      }
    }
    if (payload?.event === 'USER_MUTED' && res?.data?.targetUserId) {
      this.sockets.emitToUser(
        String(res.data.targetUserId),
        SOCKET_EVENTS.USER_MUTED,
        payload,
      );
    }
    this.sockets.broadcast(SOCKET_EVENTS.MODERATION_REPORT_UPDATED, {
      reportId: id,
      action: body.action,
      status: 'RESOLVED',
    });
    return { success: true, message: 'Action applied', data: res };
  }
}
