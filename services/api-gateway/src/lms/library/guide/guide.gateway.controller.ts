import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { GuideGatewayService } from './guide.gateway.service';
import {
  CreateGuideDto,
  UpdateGuideDto,
  PublishGuideDto,
  Level,
} from './dto/guide.dto';

@ApiTags('LMS Library Guides')
@ApiBearerAuth()
@Controller('api/v1/lms/library/guides')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuideGatewayController {
  constructor(private readonly guideService: GuideGatewayService) {}

  @ApiOperation({
    summary: 'Create new guide',
    description:
      'Creates a new guide with title, authors, topics, and optional metadata.',
  })
  @ApiResponse({
    status: 201,
    description: 'Guide created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Complete JavaScript Learning Guide',
        },
        slug: { type: 'string', example: 'complete-javascript-learning-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to learning JavaScript.',
        },
        description: {
          type: 'string',
          example: 'This guide covers everything from basics to advanced.',
        },
        authors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'John Doe' },
              avatarUrl: {
                type: 'string',
                example: 'https://example.com/author-avatar.jpg',
              },
            },
          },
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          example: ['javascript', 'programming'],
        },
        level: { type: 'string', example: 'Intermediate' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/guide-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['featured'],
        },
        status: { type: 'string', example: 'DRAFT' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid guide data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can create guides',
  })
  @Roles(Role.INSTRUCTOR_USER)
  @Post()
  async createGuide(@Body() dto: CreateGuideDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    // Ensure status is set from request body or default to PUBLISHED
    const guideData = {
      ...dto,
      status: dto.status || 'PUBLISHED',
    };

    return firstValueFrom(this.guideService.createGuide(guideData, userId));
  }

  @ApiOperation({
    summary: 'List guides',
    description:
      'Retrieves a list of guides with optional filtering by search query, topics, level, and sorting.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query to filter guides by title or content',
    required: false,
    example: 'javascript',
  })
  @ApiQuery({
    name: 'topics',
    description: 'Filter by topics (comma-separated)',
    required: false,
    example: 'javascript,programming',
  })
  @ApiQuery({
    name: 'level',
    description: 'Filter by difficulty level',
    required: false,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    example: 'INTERMEDIATE',
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort order',
    required: false,
    enum: ['newest', 'oldest', 'popular', 'rating'],
    example: 'popular',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of guides per page',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by publication status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    example: 'PUBLISHED',
  })
  @ApiResponse({
    status: 200,
    description: 'Guides retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'Complete JavaScript Learning Guide',
              },
              slug: {
                type: 'string',
                example: 'complete-javascript-learning-guide',
              },
              summary: {
                type: 'string',
                example: 'A comprehensive guide to learning JavaScript.',
              },
              authors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    avatarUrl: {
                      type: 'string',
                      example: 'https://example.com/author-avatar.jpg',
                    },
                  },
                },
              },
              topics: {
                type: 'array',
                items: { type: 'string' },
                example: ['javascript', 'programming'],
              },
              level: { type: 'string', example: 'Intermediate' },
              coverUrl: {
                type: 'string',
                example: 'https://example.com/guide-cover.jpg',
              },
              language: { type: 'string', example: 'en' },
              badges: {
                type: 'array',
                items: { type: 'string' },
                example: ['featured'],
              },
              status: { type: 'string', example: 'PUBLISHED' },
              averageRating: { type: 'number', example: 4.5 },
              reviewCount: { type: 'number', example: 15 },
              isFavorite: { type: 'boolean', example: false },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @Get()
  async listGuides(
    @Query('q') q?: string,
    @Query('topics') topics?: string,
    @Query('level') level?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const user = req?.user;
    const userRole = user?.role;
    const userId = user?.id || user?.sub || user?._id;

    const topicsArray = topics ? topics.split(',') : undefined;
    return firstValueFrom(
      this.guideService.listGuides({
        q,
        topics: topicsArray,
        level,
        sort,
        page,
        limit,
        status,
        userRole,
        userId,
      }),
    );
  }

  @ApiOperation({
    summary: 'Get guide by ID',
    description:
      'Retrieves a specific guide using its unique identifier including full details and content structure.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the guide',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Complete JavaScript Learning Guide',
        },
        slug: { type: 'string', example: 'complete-javascript-learning-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to learning JavaScript.',
        },
        description: {
          type: 'string',
          example: 'This guide covers everything from basics to advanced.',
        },
        authors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'John Doe' },
              avatarUrl: {
                type: 'string',
                example: 'https://example.com/author-avatar.jpg',
              },
              bio: {
                type: 'string',
                example: 'Experienced JavaScript developer and instructor.',
              },
            },
          },
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          example: ['javascript', 'programming', 'web-development'],
        },
        level: { type: 'string', example: 'Intermediate' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/guide-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['featured', 'popular'],
        },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 15 },
        isFavorite: { type: 'boolean', example: false },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'Getting Started' },
              content: { type: 'string', example: 'Section content here...' },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Get(':id')
  async getGuideById(@Param('id') id: string) {
    return firstValueFrom(this.guideService.getGuideById(id));
  }

  @ApiOperation({
    summary: 'Get guide by slug',
    description:
      'Retrieves a specific guide using its URL-friendly slug identifier.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly slug of the guide',
    example: 'complete-javascript-learning-guide',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Complete JavaScript Learning Guide',
        },
        slug: { type: 'string', example: 'complete-javascript-learning-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to learning JavaScript.',
        },
        description: {
          type: 'string',
          example: 'This guide covers everything from basics to advanced.',
        },
        authors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'John Doe' },
              avatarUrl: {
                type: 'string',
                example: 'https://example.com/author-avatar.jpg',
              },
            },
          },
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          example: ['javascript', 'programming'],
        },
        level: { type: 'string', example: 'Intermediate' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/guide-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['featured'],
        },
        status: { type: 'string', example: 'PUBLISHED' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 15 },
        isFavorite: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Get('slug/:slug')
  async getGuideBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.guideService.getGuideBySlug(slug));
  }

  @ApiOperation({
    summary: 'Update guide',
    description:
      'Updates an existing guide with new information. Only the guide owner can update.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the guide',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Complete JavaScript Learning Guide',
        },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid guide data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only guide owner can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Patch(':id')
  async updateGuide(
    @Param('id') id: string,
    @Body() dto: UpdateGuideDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.guideService.updateGuide(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Publish guide',
    description:
      'Publishes or unpublishes a guide, making it available or unavailable to readers.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the guide',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide publish status updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid publish data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only guide owner can publish',
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Patch(':id/publish')
  async publishGuide(
    @Param('id') id: string,
    @Body() dto: PublishGuideDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.guideService.publishGuide(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Delete guide',
    description:
      'Permanently deletes a guide and all its associated content. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the guide',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Guide deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only guide owner can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Delete(':id')
  async deleteGuide(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.guideService.deleteGuide(id, userId));
  }

  @ApiOperation({
    summary: 'Get all guide file links',
    description:
      'Retrieves all uploaded file links for guides with presigned URLs for direct access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide links retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'Complete JavaScript Learning Guide',
              },
              slug: {
                type: 'string',
                example: 'complete-javascript-learning-guide',
              },
              fileName: { type: 'string', example: 'javascript-guide.pdf' },
              objectKey: {
                type: 'string',
                example: 'library/guide/123456/javascript-guide.pdf',
              },
              presignedUrl: { type: 'string', example: 'https://...' },
              uploadedAt: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              contentType: { type: 'string', example: 'application/pdf' },
              size: { type: 'number', example: 1024000 },
            },
          },
        },
        total: { type: 'number', example: 25 },
      },
    },
  })
  @Get('links')
  async getAllGuideLinks() {
    return firstValueFrom(this.guideService.getAllLinks());
  }
}
