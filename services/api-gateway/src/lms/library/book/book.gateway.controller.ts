/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  Query,
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
import { BookGatewayService } from './book.gateway.service';
import {
  CreateBookDto,
  UpdateBookDto,
  PublishBookDto,
  GetBooksQueryDto,
  UpdateBookProgressDto,
} from './dto/book.dto';

@ApiTags('LMS Library Books')
@ApiBearerAuth()
@Controller('api/v1/lms/library/books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookGatewayController {
  constructor(private readonly bookService: BookGatewayService) {}

  @ApiOperation({
    summary: 'Create new book',
    description:
      'Creates a new book with title, authors, topics, and optional metadata.',
  })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'JavaScript: The Complete Guide' },
        slug: { type: 'string', example: 'javascript-complete-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to JavaScript programming.',
        },
        description: {
          type: 'string',
          example:
            'This book covers everything from basic JavaScript concepts to advanced topics.',
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
          example: 'https://example.com/book-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['bestseller'],
        },
        pageCount: { type: 'number', example: 450 },
        readingTimeMin: { type: 'number', example: 180 },
        status: { type: 'string', example: 'DRAFT' },
        ownerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid book data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only INSTRUCTOR_USER role can create books',
  })
  @Roles(Role.INSTRUCTOR_USER)
  @Post('createBook')
  async createBook(@Body() dto: CreateBookDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    // Ensure status is set from request body or default to PUBLISHED
    const bookData = {
      ...dto,
      status: dto.status || 'PUBLISHED',
    };

    return firstValueFrom(this.bookService.createBook(bookData, userId));
  }

  @ApiOperation({
    summary: 'Publish book',
    description:
      'Publishes or unpublishes a book, making it available or unavailable to readers.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book publish status updated successfully',
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
    description: 'Forbidden - Only book owner can publish',
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Patch(':id/publish')
  async publishBook(
    @Param('id') id: string,
    @Body() dto: PublishBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.bookService.publishBook(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Get books',
    description:
      'Retrieves a list of books with optional filtering by search query, topics, level, and sorting.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query to filter books by title or content',
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
    description: 'Number of books per page',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Books retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: {
                type: 'string',
                example: 'JavaScript: The Complete Guide',
              },
              slug: { type: 'string', example: 'javascript-complete-guide' },
              summary: {
                type: 'string',
                example: 'A comprehensive guide to JavaScript programming.',
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
                example: 'https://example.com/book-cover.jpg',
              },
              pageCount: { type: 'number', example: 450 },
              readingTimeMin: { type: 'number', example: 180 },
              status: { type: 'string', example: 'PUBLISHED' },
              averageRating: { type: 'number', example: 4.5 },
              reviewCount: { type: 'number', example: 25 },
              isFavorite: { type: 'boolean', example: false },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @Get()
  async getBooks(@Query() query: GetBooksQueryDto, @Request() req: any) {
    const user = req.user;
    const userRole = user?.role;
    const userId = user?.id || user?.sub || user?._id;

    return firstValueFrom(
      this.bookService.getBooks(query, { userRole, userId }),
    );
  }

  @ApiOperation({
    summary: 'Get book by ID',
    description:
      'Retrieves a specific book using its unique identifier including full details and content availability.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'JavaScript: The Complete Guide' },
        slug: { type: 'string', example: 'javascript-complete-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to JavaScript programming.',
        },
        description: {
          type: 'string',
          example:
            'This book covers everything from basic JavaScript concepts to advanced topics.',
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
          example: 'https://example.com/book-cover.jpg',
        },
        language: { type: 'string', example: 'en' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          example: ['bestseller', 'featured'],
        },
        pageCount: { type: 'number', example: 450 },
        readingTimeMin: { type: 'number', example: 180 },
        status: { type: 'string', example: 'PUBLISHED' },
        publishedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 25 },
        isFavorite: { type: 'boolean', example: false },
        userProgress: {
          type: 'object',
          properties: {
            currentPage: { type: 'number', example: 125 },
            totalPages: { type: 'number', example: 450 },
            progressPercentage: { type: 'number', example: 0.28 },
            lastReadAt: { type: 'string', example: '2023-01-15T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Get(':id')
  async getBookById(@Param('id') id: string) {
    return firstValueFrom(this.bookService.getBookById(id));
  }

  @ApiOperation({
    summary: 'Get book by slug',
    description:
      'Retrieves a specific book using its URL-friendly slug identifier.',
  })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly slug of the book',
    example: 'javascript-complete-guide',
  })
  @ApiResponse({
    status: 200,
    description: 'Book retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'JavaScript: The Complete Guide' },
        slug: { type: 'string', example: 'javascript-complete-guide' },
        summary: {
          type: 'string',
          example: 'A comprehensive guide to JavaScript programming.',
        },
        description: {
          type: 'string',
          example:
            'This book covers everything from basic JavaScript concepts to advanced topics.',
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
          example: 'https://example.com/book-cover.jpg',
        },
        pageCount: { type: 'number', example: 450 },
        readingTimeMin: { type: 'number', example: 180 },
        status: { type: 'string', example: 'PUBLISHED' },
        averageRating: { type: 'number', example: 4.5 },
        reviewCount: { type: 'number', example: 25 },
        isFavorite: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Get('slug/:slug')
  async getBookBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.bookService.getBookBySlug(slug));
  }

  @ApiOperation({
    summary: 'Update book',
    description:
      'Updates an existing book with new information. Only the book owner can update.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'JavaScript: The Complete Guide' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid book data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only book owner can update',
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.bookService.updateBook(id, dto, userId));
  }

  @ApiOperation({
    summary: 'Update book progress',
    description:
      'Updates the reading progress of a book for the authenticated user, including current page and completion status.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book progress updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        bookId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        currentPage: { type: 'number', example: 125 },
        totalPages: { type: 'number', example: 450 },
        progressPercentage: { type: 'number', example: 0.28 },
        isCompleted: { type: 'boolean', example: false },
        lastReadAt: { type: 'string', example: '2023-01-15T00:00:00.000Z' },
        readingTimeMinutes: { type: 'number', example: 45 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid progress data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Patch(':id/progress')
  async updateBookProgress(
    @Param('id') bookId: string,
    @Body() body: UpdateBookProgressDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(
      this.bookService.updateBookProgress(bookId, userId, body),
    );
  }

  @ApiOperation({
    summary: 'Delete book',
    description:
      'Permanently deletes a book and all its associated content. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only book owner can delete',
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Delete(':id')
  async deleteBook(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;

    if (!userId) {
      throw new Error('Authentication required - No user found');
    }

    return firstValueFrom(this.bookService.deleteBook(id, userId));
  }

  @ApiOperation({
    summary: 'Get all book file links',
    description:
      'Retrieves all uploaded file links for books with presigned URLs for direct access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Book links retrieved successfully',
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
                example: 'JavaScript: The Complete Guide',
              },
              slug: { type: 'string', example: 'javascript-complete-guide' },
              fileName: { type: 'string', example: 'javascript-book.pdf' },
              objectKey: {
                type: 'string',
                example: 'library/book/123456/javascript-book.pdf',
              },
              presignedUrl: { type: 'string', example: 'https://...' },
              uploadedAt: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              contentType: { type: 'string', example: 'application/pdf' },
              size: { type: 'number', example: 2048000 },
            },
          },
        },
        total: { type: 'number', example: 15 },
      },
    },
  })
  @Get('links')
  async getAllBookLinks() {
    return firstValueFrom(this.bookService.getAllLinks());
  }
}
