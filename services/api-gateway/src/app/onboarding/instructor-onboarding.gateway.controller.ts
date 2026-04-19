import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
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

const CV_ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function normalizeS3Prefix(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/^\/+/, '').replace(/\/+$/, '') || fallback;
}

@ApiTags('Onboarding')
@ApiCookieAuth()
@Controller('api/v1/auth/onboarding/instructor')
@UseGuards(JwtAuthGuard)
export class InstructorOnboardingGatewayController {
  private readonly logger = new Logger(
    InstructorOnboardingGatewayController.name,
  );

  constructor(private readonly onboardingService: OnboardingGatewayService) {}

  private assertInstructorCvFileMeta(file: {
    mimetype?: string;
    originalname?: string;
  }) {
    const ext = (file.originalname?.split('.').pop() || '').toLowerCase();
    const extOk = ['pdf', 'doc', 'docx'].includes(ext);
    const mime = (file.mimetype || '').toLowerCase();
    const mimeOk = CV_ALLOWED_MIMES.has(mime);
    if (!extOk && !mimeOk) {
      throw new BadRequestException('CV must be a PDF, DOC, or DOCX file');
    }
  }

  /**
   * Uploads to the app bucket from the gateway so the file is not sent over NATS
   * (NATS max payload is far smaller than a 5MB CV).
   */
  private async uploadInstructorCvToS3(params: {
    userId: string;
    buffer: Buffer;
    contentType: string;
    originalname: string;
  }): Promise<string> {
    const region = process.env.AWS_S3_REGION_APP?.trim();
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_APP?.trim();
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_APP?.trim();
    const bucket = process.env.AWS_S3_BUCKET_APP?.trim();
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new InternalServerErrorException(
        'Server storage is not configured for instructor CV uploads',
      );
    }

    const cvPrefix = normalizeS3Prefix(
      process.env.AWS_S3_KEY_PREFIX_INSTRUCTOR_CV_APP,
      'instructor-cvs',
    );

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const ext = (params.originalname?.split('.').pop() || 'pdf').toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'pdf';
    const key = `${cvPrefix}/${params.userId}/${uuidv4()}.${safeExt}`;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.contentType || 'application/octet-stream',
        }),
      );
    } catch (err: unknown) {
      this.logger.error(
        err instanceof Error ? (err.stack ?? err.message) : String(err),
      );
      throw new InternalServerErrorException('Failed to upload CV to storage');
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  @Post()
  @ApiOperation({
    summary: 'Complete instructor onboarding',
    description:
      'Multipart: text fields plus required `cv` (PDF/DOC/DOCX, max 5MB). File is stored in S3 from this service (not over NATS). Requires access token cookie.',
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
  @ApiResponse({
    status: 500,
    description: 'S3 misconfiguration or upload failure',
  })
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
    this.assertInstructorCvFileMeta({
      mimetype: cv.mimetype,
      originalname: cv.originalname,
    });

    const buffer =
      cv.buffer instanceof Buffer
        ? cv.buffer
        : Buffer.from(String(cv.buffer), 'base64');

    if (buffer.length > CV_MAX_BYTES) {
      throw new BadRequestException('CV file must not exceed 5MB');
    }

    const userId = String(req.user?._id);
    const cvUrl = await this.uploadInstructorCvToS3({
      userId,
      buffer,
      contentType: cv.mimetype || 'application/octet-stream',
      originalname: cv.originalname,
    });

    return (await firstValueFrom(
      this.onboardingService.submitInstructor({
        userId,
        track: dto.track,
        experienceYears: dto.experienceYears,
        bio: dto.bio,
        teachingStyle: dto.teachingStyle,
        motivation: dto.motivation,
        cvUrl,
      }),
    )) as {
      message: string;
      data: {
        onboardingCompleted: boolean;
        status: string;
        cvUrl: string;
        onboarding: unknown;
      };
    };
  }
}
