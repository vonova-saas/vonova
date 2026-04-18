import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { UploadedFile as CustomUploadedFile } from '../../common/interfaces/file.interface';
import { OnboardingGatewayService } from './onboarding-gateway.service';
import { InstructorOnboardingFieldsDto } from './dto/instructor-onboarding-fields.dto';

const CV_MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('Onboarding')
@ApiCookieAuth()
@Controller('api/v1/auth/onboarding/instructor')
@UseGuards(JwtAuthGuard)
export class InstructorOnboardingGatewayController {
  constructor(private readonly onboardingService: OnboardingGatewayService) {}

  @Post()
  @ApiOperation({
    summary: 'Complete instructor onboarding',
    description:
      'Multipart: text fields plus required `cv` (PDF/DOC/DOCX, max 5MB). Requires access token cookie.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'track',
        'experienceYears',
        'bio',
        'teachingStyle',
        'motivation',
        'cv',
      ],
      properties: {
        track: { type: 'string', example: 'Data Science' },
        experienceYears: { type: 'integer', example: 3 },
        bio: { type: 'string' },
        teachingStyle: { type: 'string' },
        motivation: { type: 'string' },
        cv: {
          type: 'string',
          format: 'binary',
          description: 'CV file (PDF, DOC, DOCX)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Onboarding saved; status PENDING' })
  @ApiResponse({ status: 400, description: 'Validation or missing CV' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('cv', { limits: { fileSize: CV_MAX_BYTES } }),
  )
  async submit(
    @Req() req: Request & { user?: { _id: unknown } },
    @Body() dto: InstructorOnboardingFieldsDto,
    @UploadedFile() cv: CustomUploadedFile | undefined,
  ) {
    if (!cv) {
      throw new BadRequestException('CV file is required');
    }
    const userId = String(req.user?._id);
    return firstValueFrom(
      this.onboardingService.submitInstructor({
        userId,
        track: dto.track,
        experienceYears: dto.experienceYears,
        bio: dto.bio,
        teachingStyle: dto.teachingStyle,
        motivation: dto.motivation,
        file: {
          originalname: cv.originalname,
          mimetype: cv.mimetype,
          buffer:
            cv.buffer instanceof Buffer
              ? cv.buffer.toString('base64')
              : String(cv.buffer),
        },
      }),
    );
  }
}
