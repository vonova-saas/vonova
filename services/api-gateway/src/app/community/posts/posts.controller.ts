/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import {
  RateLimit,
  RateLimitGuard,
} from '../../../common/guards/rate-limit.guard';
import type { UploadedFile as CustomUploadedFile } from '../../../common/interfaces/file.interface';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PostsGatewayService } from './posts.service';
import { CommunitySocialGatewayService } from '../social.gateway.service';
import { deliverCommunityNotification } from '../community-notification.helper';
import { CommunitySocketGateway } from '../../../community/socket/community.gateway';
import { SOCKET_EVENTS } from '../../../community/socket/socket-user.types';
import {
  CreateCommentDto,
  CreatePostDto,
  UpdateCommentDto,
  UpdatePostDto,
  SharePostDto,
} from './dto/post.dto';

function parseOptionalStringArray(raw: unknown): string[] | undefined {
  if (raw == null || raw === '') return undefined;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch {
      /* treat as delimited */
    }
    return raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

function parseOptionalBoolean(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return undefined;
}

@ApiTags('Community Posts')
@ApiBearerAuth()
@Controller('api/v1/community/posts')
@UseGuards(JwtAuthGuard)
export class PostsGatewayController {
  constructor(
    private readonly postsService: PostsGatewayService,
    private readonly social: CommunitySocialGatewayService,
    private readonly sockets: CommunitySocketGateway,
  ) {}

  private actorId(req: { user?: { _id?: string } }): string {
    return String(req.user?._id ?? '');
  }

  // ─── Posts ─────────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Create a new post',
    description:
      'Creates a new post with optional single or multiple image and video uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'This is my first post!' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['nestjs', 'typescript', 'webdev'],
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more image files for the post (max 10 files)',
        },
        videos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more video files for the post (max 5 files, 200MB per video)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Post created successfully' },
        data: {
          type: 'object',
          properties: {
            post: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                content: { type: 'string', example: 'This is my first post!' },
                author: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439012',
                    },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                    },
                  },
                },
                image: {
                  type: 'string',
                  example: 'https://example.com/post-image.jpg',
                  nullable: true,
                },
                images: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'https://example.com/post-image1.jpg',
                    'https://example.com/post-image2.jpg',
                  ],
                  nullable: true,
                },
                video: {
                  type: 'string',
                  example: 'https://example.com/post-video.mp4',
                  nullable: true,
                },
                videos: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'https://example.com/post-video1.mp4',
                    'https://example.com/post-video2.mp4',
                  ],
                  nullable: true,
                },
                tags: { type: 'array', items: { type: 'string' } },
                likes: { type: 'number', example: 5 },
                shares: { type: 'number', example: 2 },
                comments: { type: 'number', example: 3 },
                createdAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, windowMs: 60 * 60 * 1000, bucket: 'post-create' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
    ]),
  )
  async createPost(
    @Body() body: Record<string, unknown>,
    @Request()
    req: any & {
      files?: { files?: CustomUploadedFile[]; videos?: CustomUploadedFile[] };
    },
  ) {
    let tags: unknown = body.tags;
    if (tags && typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = (tags as string)
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag);
      }
    }
    if (!Array.isArray(tags)) {
      tags = [];
    }

    const createPostDto = plainToInstance(CreatePostDto, {
      content: body.content,
      tags: tags as string[],
      hashtags: parseOptionalStringArray(body.hashtags),
      visibility:
        body.visibility === 'FOLLOWERS'
          ? 'FOLLOWERS'
          : body.visibility === 'PUBLIC'
            ? 'PUBLIC'
            : undefined,
      courseId:
        typeof body.courseId === 'string' && body.courseId.trim()
          ? body.courseId
          : undefined,
      isPinned: parseOptionalBoolean(body.isPinned),
      instructorOnly: parseOptionalBoolean(body.instructorOnly),
    });

    const errors = await validate(createPostDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // Access files and videos from the request when using FileFieldsInterceptor
    const uploadedFiles = req.files?.files || [];
    const uploadedVideos = req.files?.videos || [];

    // Separate images from files based on mimetype
    const images =
      uploadedFiles.filter(
        (file) => file.mimetype && file.mimetype.startsWith('image/'),
      ) || [];

    const videos =
      uploadedVideos.filter(
        (video) => video.mimetype && video.mimetype.startsWith('video/'),
      ) || [];

    // Validate video file sizes (200MB max per video)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    for (const video of videos) {
      if (video.size > maxSize) {
        throw new BadRequestException(
          `Video file ${video.originalname} exceeds maximum size of 200MB`,
        );
      }
    }

    const created = await firstValueFrom(
      this.postsService.createPost(
        createPostDto,
        undefined,
        images,
        videos,
        req.user._id,
      ),
    );
    this.sockets.broadcast(SOCKET_EVENTS.POST_NEW, {
      authorId: String(req.user._id),
      post: (created as { data?: { post?: unknown } })?.data?.post ?? created,
    });
    return created;
  }

  @ApiOperation({
    summary: 'Get all posts',
    description: 'Retrieves a paginated list of posts',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Posts fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Posts fetched successfully' },
        data: {
          type: 'object',
          properties: {
            posts: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 50 },
                totalPages: { type: 'number', example: 5 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  @Get()
  async getAllPosts(@Query() query: { page?: number; limit?: number }) {
    return firstValueFrom(this.postsService.getAllPosts(query));
  }

  @ApiOperation({
    summary: 'Get posts by user',
    description: 'Retrieves posts created by a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'User posts fetched successfully',
  })
  @Public()
  @Get('user/:userId')
  async getPostsByUser(
    @Param('userId') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(this.postsService.getPostsByUser(userId, query));
  }

  @ApiOperation({ summary: 'Users who liked this post' })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @Public()
  @Get(':postId/likes')
  async getPostLikes(
    @Param('postId') postId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(this.postsService.getPostLikes(postId, query));
  }

  @ApiOperation({ summary: 'Users who liked this comment' })
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the comment',
    example: '507f1f77bcf86cd799439013',
  })
  @Public()
  @Get('comments/:commentId/likes')
  async getCommentLikes(
    @Param('commentId') commentId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(
      this.postsService.getCommentLikes(commentId, query),
    );
  }

  @ApiOperation({
    summary: 'Get post by ID',
    description: 'Retrieves a specific post by its ID',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Post fetched successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Post fetched successfully' },
        data: {
          type: 'object',
          properties: {
            post: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                content: { type: 'string', example: 'This is my first post!' },
                author: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439012',
                    },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                    },
                  },
                },
                image: {
                  type: 'string',
                  example: 'https://example.com/post-image.jpg',
                  nullable: true,
                },
                images: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'https://example.com/post-image1.jpg',
                    'https://example.com/post-image2.jpg',
                  ],
                  nullable: true,
                },
                video: {
                  type: 'string',
                  example: 'https://example.com/post-video.mp4',
                  nullable: true,
                },
                videos: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [
                    'https://example.com/post-video1.mp4',
                    'https://example.com/post-video2.mp4',
                  ],
                  nullable: true,
                },
                tags: { type: 'array', items: { type: 'string' } },
                likes: { type: 'number', example: 5 },
                shares: { type: 'number', example: 2 },
                comments: { type: 'number', example: 3 },
                createdAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Public()
  @Get(':postId')
  async getPostById(@Param('postId') postId: string) {
    return firstValueFrom(this.postsService.getPostById(postId));
  }

  @ApiOperation({
    summary: 'Update a post',
    description:
      'Updates an existing post with optional single or multiple image and video uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Updated post content' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['nestjs', 'updated'],
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more new image files for the post (max 10 files)',
        },
        videos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more new video files for the post (max 5 files, 200MB per video)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this post',
  })
  @Put(':postId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
    ]),
  )
  async updatePost(
    @Param('postId') postId: string,
    @Body() body: Record<string, unknown>,
    @Request()
    req: any & {
      files?: { files?: CustomUploadedFile[]; videos?: CustomUploadedFile[] };
    },
  ) {
    let tags = body.tags;

    if (tags && typeof tags === 'string') {
      // Handle comma-separated or JSON array format
      try {
        tags = JSON.parse(tags);
      } catch {
        // If not JSON, split by comma
        tags = (tags as string)
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag);
      }
    }

    const updatePostDto = plainToInstance(UpdatePostDto, {
      content: body.content,
      tags,
      hashtags: parseOptionalStringArray(body.hashtags),
      visibility:
        body.visibility === 'FOLLOWERS'
          ? 'FOLLOWERS'
          : body.visibility === 'PUBLIC'
            ? 'PUBLIC'
            : undefined,
      courseId:
        typeof body.courseId === 'string' && body.courseId.trim()
          ? body.courseId
          : undefined,
      isPinned: parseOptionalBoolean(body.isPinned),
      instructorOnly: parseOptionalBoolean(body.instructorOnly),
    });

    const errors = await validate(updatePostDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // Access files and videos from the request when using FileFieldsInterceptor
    const uploadedFiles = req.files?.files || [];
    const uploadedVideos = req.files?.videos || [];

    // Separate images from files based on mimetype
    const images =
      uploadedFiles.filter(
        (file) => file.mimetype && file.mimetype.startsWith('image/'),
      ) || [];

    const videos =
      uploadedVideos.filter(
        (video) => video.mimetype && video.mimetype.startsWith('video/'),
      ) || [];

    // Validate video file sizes (200MB max per video)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    for (const video of videos) {
      if (video.size > maxSize) {
        throw new BadRequestException(
          `Video file ${video.originalname} exceeds maximum size of 200MB`,
        );
      }
    }

    return firstValueFrom(
      this.postsService.updatePost(
        postId,
        updatePostDto,
        undefined,
        images,
        videos,
        req.user._id,
        req.user.role,
      ),
    );
  }

  @ApiOperation({
    summary: 'Delete a post',
    description: 'Deletes a post by its ID',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Post deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to delete this post',
  })
  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @Request() req: any) {
    const result = await firstValueFrom(
      this.postsService.deletePost(postId, req.user._id, req.user.role),
    );
    const data = (result as { data?: Record<string, unknown> })?.data ?? result;
    this.sockets.broadcast(SOCKET_EVENTS.POST_DELETED, {
      postId,
      groupId: (data as { groupId?: string })?.groupId,
    });
    const originalPostId = (data as { originalPostId?: string })?.originalPostId;
    if (originalPostId) {
      this.sockets.broadcast(SOCKET_EVENTS.POST_UNREPOSTED, {
        postId: originalPostId,
        sharesCount: (data as { originalPostSharesCount?: number })
          ?.originalPostSharesCount,
      });
    }
    return result;
  }

  @ApiOperation({
    summary: 'Toggle like on a post',
    description: 'Likes or unlikes a post based on current state',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Post liked/unliked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Post liked' },
        data: {
          type: 'object',
          properties: {
            liked: { type: 'boolean', example: true },
            likesCount: { type: 'number', example: 6 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':postId/like')
  async toggleLike(@Param('postId') postId: string, @Request() req: any) {
    const result = await firstValueFrom(
      this.postsService.toggleLike(postId, req.user._id),
    );
    const data = (
      result as {
        data?: { liked?: boolean; likesCount?: number; authorId?: string };
      }
    )?.data;
    this.sockets.emitToPost(postId, SOCKET_EVENTS.POST_LIKED, {
      postId,
      userId: String(req.user._id),
      liked: data?.liked,
      likesCount: data?.likesCount,
    });
    this.sockets.broadcast(SOCKET_EVENTS.POST_LIKED, {
      postId,
      userId: String(req.user._id),
      liked: data?.liked,
      likesCount: data?.likesCount,
    });
    if (data?.liked && data?.authorId) {
      void deliverCommunityNotification(this.social, this.sockets, {
        recipientId: String(data.authorId),
        actorId: this.actorId(req),
        type: 'LIKE',
        entityType: 'POST',
        entityId: postId,
        title: 'New like',
        message: 'Someone liked your post',
      });
    }
    return result;
  }

  @ApiOperation({
    summary: 'Share a post',
    description:
      'Creates a new shared post referencing the original post with optional comment',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post to share',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    required: false,
    schema: {
      type: 'object',
      properties: {
        comment: {
          type: 'string',
          example: 'Check out this amazing post!',
          description: 'Optional comment to add when sharing the post',
          maxLength: 500,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post shared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Post shared successfully' },
        data: {
          type: 'object',
          properties: {
            sharedPost: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
                author: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439012',
                    },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                    },
                  },
                },
                content: {
                  type: 'string',
                  example: 'Check out this amazing post!',
                },
                shareComment: {
                  type: 'string',
                  example: 'Check out this amazing post!',
                },
                sharedPost: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    content: {
                      type: 'string',
                      example: 'This is the original post content',
                    },
                    author: {
                      type: 'object',
                      properties: {
                        _id: {
                          type: 'string',
                          example: '507f1f77bcf86cd799439013',
                        },
                        name: { type: 'string', example: 'Jane Smith' },
                        avatarUrl: {
                          type: 'string',
                          example: 'https://example.com/avatar2.jpg',
                        },
                      },
                    },
                  },
                },
                sharedBy: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439012',
                    },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                    },
                  },
                },
                createdAt: {
                  type: 'string',
                  example: '2023-01-01T00:00:00.000Z',
                },
              },
            },
            originalPostSharesCount: { type: 'number', example: 3 },
            shareableLink: {
              type: 'string',
              example: 'http://localhost:3000/posts/507f1f77bcf86cd799439011',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post(':postId/share')
  async sharePost(
    @Param('postId') postId: string,
    @Body() body: SharePostDto,
    @Request() req: any,
  ) {
    const sharePostDto = plainToInstance(SharePostDto, {
      comment: body.comment,
    });

    const errors = await validate(sharePostDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const result = await firstValueFrom(
      this.postsService.sharePost(postId, req.user._id, sharePostDto.comment),
    );
    const shareData =
      (result as { data?: { sharedPost?: unknown; originalPostSharesCount?: number } })
        ?.data ?? (result as { originalPostSharesCount?: number });
    this.sockets.broadcast(SOCKET_EVENTS.POST_REPOSTED, {
      postId,
      userId: String(req.user._id),
      sharesCount: shareData?.originalPostSharesCount,
      sharedPost:
        (shareData as { sharedPost?: unknown })?.sharedPost ?? result,
    });
    const originalAuthorId = (shareData as { originalAuthorId?: string })
      ?.originalAuthorId;
    if (originalAuthorId) {
      void deliverCommunityNotification(this.social, this.sockets, {
        recipientId: originalAuthorId,
        actorId: this.actorId(req),
        type: 'REPOST',
        entityType: 'POST',
        entityId: postId,
        title: 'Post reposted',
        message: 'Someone reposted your post',
      });
    }
    return result;
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Add comment to a post',
    description: 'Adds a comment to a specific post with optional image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Great post!' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file for the comment',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Comment added successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Comment added successfully' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            content: { type: 'string', example: 'Great post!' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                name: { type: 'string', example: 'John Doe' },
                avatarUrl: {
                  type: 'string',
                  example: 'https://example.com/avatar.jpg',
                },
              },
            },
            image: {
              type: 'string',
              example: 'https://example.com/comment-image.jpg',
            },
            likes: { type: 'number', example: 2 },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post(':postId/comments')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 30, windowMs: 60_000, bucket: 'comment-create' })
  @UseInterceptors(FileInterceptor('file'))
  async addComment(
    @Param('postId') postId: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: CustomUploadedFile | undefined,
    @Request() req: any,
  ) {
    const createCommentDto = plainToInstance(CreateCommentDto, {
      text: body.content,
    });

    const errors = await validate(createCommentDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const result = await firstValueFrom(
      this.postsService.createComment(
        postId,
        createCommentDto,
        file,
        req.user._id,
      ),
    );
    this.sockets.emitToPost(postId, SOCKET_EVENTS.POST_COMMENTED, {
      postId,
      userId: String(req.user._id),
      comment:
        (result as { data?: unknown })?.data ?? result,
    });
    this.sockets.broadcast(SOCKET_EVENTS.POST_COMMENTED, {
      postId,
      userId: String(req.user._id),
    });
    const commentData =
      (result as { data?: { postAuthorId?: string; postId?: string } })?.data ??
      (result as { postAuthorId?: string; postId?: string });
    if (commentData?.postAuthorId) {
      void deliverCommunityNotification(this.social, this.sockets, {
        recipientId: String(commentData.postAuthorId),
        actorId: this.actorId(req),
        type: 'COMMENT',
        entityType: 'POST',
        entityId: postId,
        title: 'New comment',
        message: 'Someone commented on your post',
      });
    }
    return result;
  }

  @ApiOperation({
    summary: 'Get comments for a post',
    description: 'Retrieves a paginated list of comments for a specific post',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            comments: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 25 },
                totalPages: { type: 'number', example: 3 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  @Public()
  @Get(':postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(this.postsService.getComments(postId, query));
  }

  @ApiOperation({
    summary: 'Update a comment',
    description: 'Updates an existing comment with optional image upload',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the comment',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Updated comment content' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Optional new image file for the comment',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this comment',
  })
  @Put('comments/:commentId')
  @UseInterceptors(FileInterceptor('file'))
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: CustomUploadedFile | undefined,
    @Request() req: any,
  ) {
    const updateCommentDto = plainToInstance(UpdateCommentDto, {
      text: body.content,
    });

    const errors = await validate(updateCommentDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return firstValueFrom(
      this.postsService.updateComment(
        commentId,
        updateCommentDto,
        file,
        req.user._id,
        req.user.role,
      ),
    );
  }

  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Deletes a comment by its ID',
  })
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the comment',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to delete this comment',
  })
  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.postsService.deleteComment(commentId, req.user._id, req.user.role),
    );
  }

  @ApiOperation({
    summary: 'Toggle like on a comment',
    description: 'Likes or unlikes a comment based on current state',
  })
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the comment',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment like toggled successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            liked: { type: 'boolean', example: true },
            likesCount: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @Post('comments/:commentId/like')
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.postsService.toggleCommentLike(commentId, req.user._id),
    );
  }

  // ─── Replies ───────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Reply to a comment',
    description: 'Adds a reply to a specific comment with optional image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the parent comment',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Reply content',
          example: 'This is my reply to your comment',
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reply created successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            text: { type: 'string', example: 'This is my reply' },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                name: { type: 'string', example: 'John Doe' },
                profilePicture: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
            parentComment: { type: 'string', example: '507f1f77bcf86cd799439013' },
            likes: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'number', example: 0 },
            createdAt: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Comment or post not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post(':postId/comments/:commentId/reply')
  @UseInterceptors(FileInterceptor('file'))
  async replyToComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: CustomUploadedFile | undefined,
    @Request() req: any,
  ) {
    const createCommentDto = plainToInstance(CreateCommentDto, {
      text: body.content,
    });

    const errors = await validate(createCommentDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // Handle file upload if present
    if (file) {
      return firstValueFrom(
        this.postsService.createReplyWithFile(
          commentId,
          postId,
          req.user._id,
          createCommentDto,
          file,
        ),
      );
    }

    return firstValueFrom(
      this.postsService.createReply(
        commentId,
        postId,
        req.user._id,
        createCommentDto,
      ),
    );
  }

  @ApiOperation({
    summary: 'Get replies for a comment',
    description: 'Retrieves a paginated list of replies for a specific comment',
  })
  @ApiParam({
    name: 'commentId',
    description: 'The unique identifier of the comment',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Replies retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            replies: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 5 },
                total: { type: 'number', example: 12 },
                totalPages: { type: 'number', example: 3 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Get('comments/:commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(this.postsService.getReplies(commentId, query));
  }
}
