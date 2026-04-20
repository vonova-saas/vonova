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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { UploadedFile as CustomUploadedFile } from '../../../common/interfaces/file.interface';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PostsGatewayService } from './posts.service';
import { CreateCommentDto, CreatePostDto, UpdateCommentDto, UpdatePostDto } from './dto/post.dto';


@ApiTags('Community Posts')
@ApiBearerAuth()
@Controller('api/v1/community/posts')
@UseGuards(JwtAuthGuard)
export class PostsGatewayController {
  constructor(private readonly postsService: PostsGatewayService) {}

  // ─── Posts ─────────────────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Create a new post',
    description: 'Creates a new post with optional single or multiple image uploads',
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
          description: 'Optional one or more image files for the post (max 10 files)',
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
                    _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
                  },
                },
                image: { type: 'string', example: 'https://example.com/post-image.jpg', nullable: true },
                images: { 
                  type: 'array', 
                  items: { type: 'string' }, 
                  example: ['https://example.com/post-image1.jpg', 'https://example.com/post-image2.jpg'],
                  nullable: true 
                },
                tags: { type: 'array', items: { type: 'string' } },
                likes: { type: 'number', example: 5 },
                shares: { type: 'number', example: 2 },
                comments: { type: 'number', example: 3 },
                createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token is required' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  async createPost(
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: CustomUploadedFile[] | undefined,
    @Request() req: any,
  ) {
    const createPostDto = plainToInstance(CreatePostDto, {
      content: body.content,
      tags: [],
    });

    const errors = await validate(createPostDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return firstValueFrom(
      this.postsService.createPost(createPostDto, undefined, files, req.user._id),
    );
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
  @Get('user/:userId')
  async getPostsByUser(
    @Param('userId') userId: string,
    @Query() query: { page?: number; limit?: number },
  ) {
    return firstValueFrom(this.postsService.getPostsByUser(userId, query));
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
                    _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
                  },
                },
                image: { type: 'string', example: 'https://example.com/post-image.jpg', nullable: true },
                images: { 
                  type: 'array', 
                  items: { type: 'string' }, 
                  example: ['https://example.com/post-image1.jpg', 'https://example.com/post-image2.jpg'],
                  nullable: true 
                },
                tags: { type: 'array', items: { type: 'string' } },
                likes: { type: 'number', example: 5 },
                shares: { type: 'number', example: 2 },
                comments: { type: 'number', example: 3 },
                createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':postId')
  async getPostById(@Param('postId') postId: string) {
    return firstValueFrom(this.postsService.getPostById(postId));
  }

  @ApiOperation({
    summary: 'Update a post',
    description: 'Updates an existing post with optional single or multiple image uploads',
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
          description: 'Optional one or more new image files for the post (max 10 files)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update this post' })
  @Put(':postId')
  @UseInterceptors(FilesInterceptor('files', 10))
  async updatePost(
    @Param('postId') postId: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: CustomUploadedFile[] | undefined,
    @Request() req: any,
  ) {
    let tags = body.tags;

    if (tags && typeof tags === 'string') {
      // Handle comma-separated or JSON array format
      try {
        tags = JSON.parse(tags);
      } catch {
        // If not JSON, split by comma
        tags = (tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }
    }

    const updatePostDto = plainToInstance(UpdatePostDto, {
      content: body.content,
      tags,
    });

    const errors = await validate(updatePostDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return firstValueFrom(
      this.postsService.updatePost(postId, updatePostDto, undefined, files, req.user._id, req.user.role),
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
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to delete this post' })
  @Delete(':postId')
  async deletePost(@Param('postId') postId: string, @Request() req: any) {
    return firstValueFrom(
      this.postsService.deletePost(postId, req.user._id, req.user.role),
    );
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
    return firstValueFrom(this.postsService.toggleLike(postId, req.user._id));
  }

  @ApiOperation({
    summary: 'Share a post',
    description: 'Increments the share count of a post',
  })
  @ApiParam({
    name: 'postId',
    description: 'The unique identifier of the post',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Post shared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Post shared successfully' },
        data: {
          type: 'object',
          properties: {
            sharesCount: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':postId/share')
  async sharePost(@Param('postId') postId: string) {
    return firstValueFrom(this.postsService.sharePost(postId));
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
                avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
              },
            },
            image: { type: 'string', example: 'https://example.com/comment-image.jpg' },
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

    return firstValueFrom(
      this.postsService.createComment(postId, createCommentDto, file, req.user._id),
    );
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
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update this comment' })
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
      this.postsService.updateComment(commentId, updateCommentDto, file, req.user._id, req.user.role),
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
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to delete this comment' })
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
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
    description: 'Comment liked/unliked successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Comment liked' },
        data: {
          type: 'object',
          properties: {
            liked: { type: 'boolean', example: true },
            likesCount: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Post('comments/:commentId/like')
  async toggleCommentLike(@Param('commentId') commentId: string, @Request() req: any) {
    return firstValueFrom(this.postsService.toggleCommentLike(commentId, req.user._id));
  }
}
