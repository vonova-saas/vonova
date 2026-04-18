import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminGatewayService } from './admin.service';
import { CreateDashboardSupportDto } from './dto/create-dashboard-support.dto';

@ApiTags('Support (Dashboard)')
@ApiBearerAuth()
@Controller('api/v1/support')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid `accessToken` cookie.',
  schema: {
    example: { statusCode: 401, message: 'Access token is required' },
  },
})
export class DashboardSupportGatewayController {
  constructor(private readonly adminService: AdminGatewayService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit bug or feedback (dashboard pipeline)',
    description:
      'Creates a support ticket (`BUG` or `FEEDBACK`) in the admin service for the authenticated user and triggers an admin notification. Idempotent behaviour is not guaranteed if the client retries the same payload.',
  })
  @ApiBody({ type: CreateDashboardSupportDto })
  @ApiResponse({
    status: 200,
    description: 'Ticket created; response is the NATS RPC envelope from the admin service',
    schema: {
      example: {
        success: true,
        message: 'Support ticket created',
        data: {
          _id: '507f1f77bcf86cd799439016',
          userId: '507f1f77bcf86cd799439013',
          message: 'Roadmap PDF export times out after 60s.',
          type: 'BUG',
          status: 'OPEN',
          createdAt: '2026-04-18T14:22:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (empty message, invalid type, etc.)',
  })
  async create(
    @Req() req: { user: { _id: string } },
    @Body() dto: CreateDashboardSupportDto,
  ) {
    return firstValueFrom(
      this.adminService.createDashboardSupport({
        userId: req.user._id,
        message: dto.message,
        type: dto.type,
      }),
    );
  }
}
