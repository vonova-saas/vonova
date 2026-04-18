import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OnboardingGatewayService } from './onboarding-gateway.service';
import { StudentOnboardingBodyDto } from './dto/student-onboarding.dto';

@ApiTags('Onboarding')
@ApiCookieAuth()
@Controller('api/v1/auth/onboarding/student')
@UseGuards(JwtAuthGuard)
export class StudentOnboardingGatewayController {
  constructor(private readonly onboardingService: OnboardingGatewayService) {}

  @Post()
  @ApiOperation({
    summary: 'Complete student onboarding',
    description:
      'Structured student profile after welcome. Requires access token cookie.',
  })
  @ApiBody({ type: StudentOnboardingBodyDto })
  @ApiResponse({ status: 200, description: 'Onboarding saved' })
  @ApiResponse({ status: 400, description: 'Validation or wrong role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submit(
    @Req() req: Request & { user?: { _id: unknown } },
    @Body() dto: StudentOnboardingBodyDto,
  ) {
    const userId = String(req.user?._id);
    return firstValueFrom(this.onboardingService.submitStudent(userId, dto));
  }
}
