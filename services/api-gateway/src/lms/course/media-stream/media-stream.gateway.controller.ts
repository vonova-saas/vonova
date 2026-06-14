/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { S3Service } from 'src/common/utils/storage/s3.service';
import { resolveRequesterUserId } from 'src/common/utils/request-user-id';
import { pipeS3ObjectStreamToResponse } from 'src/common/media/pipe-s3-object-stream';
import { logMediaStreamRequest } from 'src/common/media/media-stream-log';

type StreamMetaBase =
  | { error: null; objectKey: string; contentType: string }
  | { error: string; message?: string };

type MaterialStreamMeta = StreamMetaBase & {
  contentDispositionInline?: string;
  contentDispositionAttachment?: string;
};

@ApiTags('Media (LMS)')
@ApiBearerAuth()
@Controller('api/v1/media/lms')
@UseGuards(JwtAuthGuard)
export class MediaStreamGatewayController {
  private readonly logger = new Logger(MediaStreamGatewayController.name);

  constructor(
    @Inject('NATS_SERVICE') private readonly nats: ClientProxy,
    private readonly s3: S3Service,
  ) {}

  private requireUserId(req: Request): string {
    const userId = resolveRequesterUserId(req);
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  private mapMetaError(meta: { error: string; message?: string }): never {
    const status =
      meta.error === 'forbidden'
        ? HttpStatus.FORBIDDEN
        : HttpStatus.NOT_FOUND;
    throw new HttpException(meta.message ?? meta.error, status);
  }

  private async streamFromMeta(
    req: Request,
    res: Response,
    meta: StreamMetaBase & {
      contentDispositionInline?: string;
      contentDispositionAttachment?: string;
    },
    disposition?: 'inline' | 'attachment',
  ): Promise<void> {
    if (meta.error !== null) {
      this.mapMetaError(meta);
    }
    const range =
      typeof req.headers.range === 'string' ? req.headers.range : undefined;
    const out = await this.s3.getObjectStreamForMedia({
      objectKey: meta.objectKey,
      range,
    });
    const contentDisposition =
      disposition === 'attachment'
        ? meta.contentDispositionAttachment
        : meta.contentDispositionInline;
    pipeS3ObjectStreamToResponse(res, out, {
      contentType: meta.contentType,
      contentDisposition,
      route: req.originalUrl,
    });
    logMediaStreamRequest(req, {
      path: req.path,
      bucket: 'lms',
      keySample: meta.objectKey.slice(0, 80),
      contentType: meta.contentType,
      status: res.statusCode || 200,
      userId: resolveRequesterUserId(req),
    });
  }

  @Get('courses/:courseId/lessons/:lessonId/video')
  @ApiOperation({ summary: 'Stream lesson video (stable URL)' })
  async streamLessonVideo(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userId = this.requireUserId(req);
    let meta: StreamMetaBase;
    try {
      meta = await firstValueFrom(
        this.nats.send<StreamMetaBase>(
          { cmd: 'app.courses.content.lessonVideoStreamMeta' },
          { courseId, lessonId, userId },
        ),
      );
    } catch (e) {
      this.logger.warn(
        `lessonVideoStreamMeta: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new HttpException(
        'Could not resolve video',
        HttpStatus.BAD_GATEWAY,
      );
    }
    await this.streamFromMeta(req, res, meta);
  }

  @Get('courses/:courseId/lessons/:lessonId/poster')
  @ApiOperation({ summary: 'Stream lesson poster/thumbnail (stable URL)' })
  async streamLessonPoster(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<StreamMetaBase>(
        { cmd: 'app.courses.content.lessonPosterStreamMeta' },
        { courseId, lessonId, userId },
      ),
    );
    await this.streamFromMeta(req, res, meta);
  }

  @Get('materials/:materialId/view')
  @ApiQuery({ name: 'type', required: false })
  @ApiOperation({ summary: 'Stream library material inline (PDF iframe)' })
  async streamMaterialView(
    @Param('materialId') materialId: string,
    @Query('type') type: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<MaterialStreamMeta>(
        { cmd: 'library.getMaterialStreamMeta' },
        { materialId, materialType: type, userId },
      ),
    );
    await this.streamFromMeta(req, res, meta, 'inline');
  }

  @Get('materials/:materialId/download')
  @ApiQuery({ name: 'type', required: false })
  @ApiOperation({ summary: 'Download library material' })
  async streamMaterialDownload(
    @Param('materialId') materialId: string,
    @Query('type') type: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<MaterialStreamMeta>(
        { cmd: 'library.getMaterialStreamMeta' },
        { materialId, materialType: type, userId },
      ),
    );
    await this.streamFromMeta(req, res, meta, 'attachment');
  }

  @Get('courses/:courseId/thumbnail')
  @ApiOperation({ summary: 'Stream course thumbnail' })
  async streamCourseThumbnail(
    @Param('courseId') courseId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const userId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<StreamMetaBase>(
        { cmd: 'app.courses.courseThumbnailStreamMeta' },
        { courseId, userId },
      ),
    );
    await this.streamFromMeta(req, res, meta);
  }
}
