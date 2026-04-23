import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
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
import { PresentationGatewayService } from './presentation.gateway.service';
import {
  CreatePresentationDto,
  UpdatePresentationDto,
  PublishPresentationDto,
} from './dto/presentation.dto';

@ApiTags('LMS Library Presentations')
@ApiBearerAuth()
@Controller('api/v1/lms/library/presentation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresentationGatewayController {
  constructor(
    private readonly presentationService: PresentationGatewayService,
  ) {}

  @ApiOperation({
    summary: 'Create new presentation',
    description:
      'Creates a new presentation with title, authors, topics, and optional metadata.',
  })
  @ApiResponse({
    status: 201,
    description: 'Presentation created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'JavaScript Fundamentals Presentation',
        },
        slug: {
          type: 'string',
          example: 'javascript-fundamentals-presentation',
        },
        summary: {
          type: 'string',
          example: 'An introduction to JavaScript fundamentals.',
        },
        description: {
          type: 'string',
          example: 'This presentation covers basic JavaScript concepts.',
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
        level: { type: 'string', example: 'Beginner' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/presentation-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['interactive'],
        },
        status: { type: 'string', example: 'DRAFT' },
        ownerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid presentation data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can create presentations',
  })
  @Roles(Role.INSTRUCTOR_USER)
  @Post('createPresentation')
  async create(@Body() dto: CreatePresentationDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    // Ensure status is set from request body or default to PUBLISHED
    const presentationData = {
      ...dto,
      status: dto.status || 'PUBLISHED'
    };
    
    return firstValueFrom(this.presentationService.create(presentationData, userId));
  }

  @ApiOperation({
    summary: 'Update presentation',
    description:
      'Updates an existing presentation with new information. Only the presentation owner can update.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'JavaScript Fundamentals Presentation',
        },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid presentation data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only presentation owner can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Patch('updatePresentation/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePresentationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(this.presentationService.update(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Publish presentation',
    description:
      'Publishes or unpublishes a presentation, making it available or unavailable to viewers.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation publish status updated successfully',
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
    description: 'Forbidden - Only presentation owner can publish',
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Patch('publishPresentation/:id')
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishPresentationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(this.presentationService.publish(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Delete presentation',
    description:
      'Permanently deletes a presentation and all its associated content. This action cannot be undone.',
  })
  @ApiParam({
    name: 'presentationId',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Presentation deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only presentation owner can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Delete('deletePresentation/:presentationId')
  async delete(
    @Param('presentationId') presentationId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(
      this.presentationService.delete(presentationId, userId),
    );
  }

  @ApiOperation({
    summary: 'Get all presentations',
    description:
      'Retrieves a list of presentations with optional filtering and sorting.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query to filter presentations by title or content',
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
    description: 'Number of presentations per page',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Presentations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        presentations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'JavaScript Fundamentals Presentation',
              },
              slug: {
                type: 'string',
                example: 'javascript-fundamentals-presentation',
              },
              summary: {
                type: 'string',
                example: 'An introduction to JavaScript fundamentals.',
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
              level: { type: 'string', example: 'Beginner' },
              coverUrl: {
                type: 'string',
                example: 'https://example.com/presentation-cover.jpg',
              },
              language: { type: 'string', example: 'en' },
              badges: {
                type: 'array',
                items: { type: 'string' },
                example: ['interactive'],
              },
              status: { type: 'string', example: 'PUBLISHED' },
              averageRating: { type: 'number', example: 4.5 },
              reviewCount: { type: 'number', example: 10 },
              isFavorite: { type: 'boolean', example: false },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 30 },
            totalPages: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @Get('getAllPresentations')
  async getAll(@Query() query: any, @Request() req?: any) {
    const user = req?.user;
    const userRole = user?.role;
    const userId = user?.id || user?.sub || user?._id;
    
    const queryWithUser = {
      ...query,
      userRole,
      userId
    };
    
    return firstValueFrom(this.presentationService.getAll(queryWithUser));
  }

  @ApiOperation({
    summary: 'Get presentation by ID',
    description:
      'Retrieves a specific presentation using its unique identifier including full details and content structure.',
  })
  @ApiParam({
    name: 'presentationId',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'JavaScript Fundamentals Presentation',
        },
        slug: {
          type: 'string',
          example: 'javascript-fundamentals-presentation',
        },
        summary: {
          type: 'string',
          example: 'An introduction to JavaScript fundamentals.',
        },
        description: {
          type: 'string',
          example: 'This presentation covers basic JavaScript concepts.',
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
        level: { type: 'string', example: 'Beginner' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/presentation-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['interactive', 'featured'],
        },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 10 },
        isFavorite: { type: 'boolean', example: false },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'Introduction' },
              content: { type: 'string', example: 'Slide content here...' },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @ApiOperation({
    summary: 'Get all presentation file links',
    description:
      'Retrieves all uploaded file links for presentations with presigned URLs for direct access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation links retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'JavaScript Fundamentals Presentation' },
              slug: { type: 'string', example: 'javascript-fundamentals-presentation' },
              fileName: { type: 'string', example: 'javascript-presentation.pdf' },
              objectKey: { type: 'string', example: 'library/presentation/123456/javascript-presentation.pdf' },
              presignedUrl: { type: 'string', example: 'https://...' },
              uploadedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              contentType: { type: 'string', example: 'application/pdf' },
              size: { type: 'number', example: 5120000 },
            },
          },
        },
        total: { type: 'number', example: 8 },
      },
    },
  })
  @Get('links')
  async getAllPresentationLinks() {
    return firstValueFrom(this.presentationService.getAllLinks());
  }

  @ApiOperation({
    summary: 'Get presentation by ID',
    description:
      'Retrieves a specific presentation using its unique identifier including full details and content structure.',
  })
  @ApiParam({
    name: 'presentationId',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'JavaScript Fundamentals Presentation',
        },
        slug: {
          type: 'string',
          example: 'javascript-fundamentals-presentation',
        },
        summary: {
          type: 'string',
          example: 'An introduction to JavaScript fundamentals.',
        },
        description: {
          type: 'string',
          example: 'This presentation covers basic JavaScript concepts.',
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
        level: { type: 'string', example: 'Beginner' },
        coverUrl: {
          type: 'string',
          example: 'https://example.com/presentation-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['interactive', 'featured'],
        },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 10 },
        isFavorite: { type: 'boolean', example: false },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'Introduction' },
              content: { type: 'string', example: 'Slide content here...' },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Get('getPresentationById/:presentationId')
  async getById(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getById(presentationId));
  }

  @ApiOperation({
    summary: 'Get presentation content',
    description:
      'Retrieves the full content and slides of a specific presentation for viewing.',
  })
  @ApiParam({
    name: 'presentationId',
    description: 'The unique identifier of the presentation',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Presentation content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'JavaScript Fundamentals Presentation',
        },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              content: {
                type: 'string',
                example: 'Slide content including text, images, and interactive elements...',
              },
              order: { type: 'number', example: 1 },
              slideType: { type: 'string', example: 'TITLE' },
              duration: { type: 'number', example: 30 },
              notes: {
                type: 'string',
                example: 'Speaker notes for this slide',
              },
            },
          },
        },
        totalSlides: { type: 'number', example: 25 },
        estimatedDuration: { type: 'number', example: 1800 },
        lastViewedAt: { type: 'string', example: '2023-01-15T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to presentation',
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Get(':presentationId/content')
  async getContent(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getContent(presentationId));
  }

  }
