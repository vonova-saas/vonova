/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AppAuthS3Service } from 'src/common/utils/storage/app-auth-s3.service';
import { CommunityS3Service } from 'src/common/utils/storage/community-s3.service';
import { resolveRequesterUserId } from 'src/common/utils/request-user-id';
import { pipeS3ObjectStreamToResponse } from 'src/common/media/pipe-s3-object-stream';
import { logMediaStreamRequest } from 'src/common/media/media-stream-log';

type CommunityStreamMeta =
  | {
      error: null;
      objectKey: string;
      contentType: string;
      bucket?: 'community' | 'app-auth';
    }
  | { error: string; message?: string };

function isS3ObjectMissing(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    e?.name === 'NoSuchKey' ||
    e?.name === 'NotFound' ||
    e?.$metadata?.httpStatusCode === 404
  );
}

@ApiTags('Media (Community)')
@ApiBearerAuth()
@Controller('api/v1/media/community')
@UseGuards(JwtAuthGuard)
export class CommunityMediaStreamGatewayController {
  private readonly logger = new Logger(CommunityMediaStreamGatewayController.name);

  constructor(
    @Inject('NATS_SERVICE') private readonly nats: ClientProxy,
    private readonly s3: CommunityS3Service,
    private readonly appAuthS3: AppAuthS3Service,
  ) {}

  private requireUserId(req: Request): string {
    const userId = resolveRequesterUserId(req);
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  private async streamMeta(
    req: Request,
    res: Response,
    meta: CommunityStreamMeta,
  ): Promise<void> {
    if (meta.error !== null) {
      const status =
        meta.error === 'forbidden'
          ? HttpStatus.FORBIDDEN
          : HttpStatus.NOT_FOUND;
      throw new HttpException(meta.message ?? meta.error, status);
    }
    const range =
      typeof req.headers.range === 'string' ? req.headers.range : undefined;
    const useAuthBucket = meta.bucket === 'app-auth';
    let out;
    const fetchCommunity = () =>
      this.s3.getObjectStreamForMedia({
        objectKey: meta.objectKey,
        range,
      });
    if (useAuthBucket) {
      if (!this.appAuthS3.isConfigured()) {
        throw new HttpException(
          'Auth media bucket is not configured on the gateway',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      try {
        out = await this.appAuthS3.getObjectStreamForMedia({
          objectKey: meta.objectKey,
          range,
        });
      } catch (err) {
        if (!isS3ObjectMissing(err)) throw err;
        out = await fetchCommunity();
      }
    } else {
      out = await fetchCommunity();
    }
    pipeS3ObjectStreamToResponse(res, out, {
      contentType: meta.contentType,
      route: req.originalUrl,
    });
    logMediaStreamRequest(req, {
      path: req.path,
      bucket: useAuthBucket ? 'app-auth' : 'community',
      keySample: meta.objectKey.slice(0, 80),
      contentType: meta.contentType,
      status: res.statusCode || 200,
      userId: resolveRequesterUserId(req),
    });
  }

  @Get('users/:userId/avatar')
  @ApiOperation({ summary: 'Stream community user avatar' })
  async userAvatar(
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const requesterId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.userAvatarStreamMeta' },
        { userId, requesterId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('users/:userId/cover')
  async userCover(
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.userCoverStreamMeta' },
        { userId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('posts/:postId/images/:index')
  async postImage(
    @Param('postId') postId: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const requesterId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.postImageStreamMeta' },
        { postId, index, requesterId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('articles/:articleId/images/:blockIndex')
  async articleBlockImage(
    @Param('articleId') articleId: string,
    @Param('blockIndex', ParseIntPipe) blockIndex: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.articleBlockImageStreamMeta' },
        { articleId, blockIndex },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('articles/:articleId/cover')
  async articleCover(
    @Param('articleId') articleId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.articleCoverStreamMeta' },
        { articleId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('conversations/:conversationId/messages/:messageId/attachments/:index')
  async dmAttachment(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const requesterId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.dmAttachmentStreamMeta' },
        { conversationId, messageId, index, requesterId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }

  @Get('groups/:groupId/messages/:messageId/attachments/:index')
  async groupAttachment(
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const requesterId = this.requireUserId(req);
    const meta = await firstValueFrom(
      this.nats.send<CommunityStreamMeta>(
        { cmd: 'app.media.community.groupAttachmentStreamMeta' },
        { groupId, messageId, index, requesterId },
      ),
    );
    await this.streamMeta(req, res, meta);
  }
}
