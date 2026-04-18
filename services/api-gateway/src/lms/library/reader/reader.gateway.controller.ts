import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReaderGatewayService } from './reader.gateway.service';
import { UpdateReaderBookProgressDto } from './dto/reader.dto';

@ApiTags('LMS Library Reader')
@ApiBearerAuth()
@Controller('api/v1/lms/library')
@UseGuards(JwtAuthGuard)
export class ReaderGatewayController {
  constructor(private readonly readerService: ReaderGatewayService) {}

  @ApiOperation({
    summary: 'Get book content',
    description:
      'Retrieves the content of a specific book for the authenticated user.',
  })
  @ApiParam({
    name: 'bookId',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book content' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: {
              type: 'string',
              example: 'JavaScript: The Complete Guide',
            },
            content: { type: 'string', example: 'Book content here...' },
            totalPages: { type: 'number', example: 450 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Book not found',
  })
  @Get('books/:bookId/content')
  async getBookContent(@Param('bookId') bookId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const data = await firstValueFrom(
      this.readerService.getBookContent(bookId, userId),
    );
    return { message: 'Book content retrieved successfully', data };
  }

  @ApiOperation({
    summary: 'Get guide content',
    description:
      'Retrieves the content of a specific guide for reading.',
  })
  @ApiParam({
    name: 'guideId',
    description: 'The unique identifier of the guide',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Guide content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Guide content' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: {
              type: 'string',
              example: 'Complete JavaScript Learning Guide',
            },
            content: { type: 'string', example: 'Guide content here...' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Getting Started' },
                  content: { type: 'string', example: 'Section content...' },
                  order: { type: 'number', example: 1 },
                },
              },
            },
            totalSections: { type: 'number', example: 10 },
            estimatedReadingTime: { type: 'number', example: 120 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Guide not found',
  })
  @Get('guides/:guideId/content')
  async getGuideContent(@Param('guideId') guideId: string) {
    const data = await firstValueFrom(
      this.readerService.getGuideContent(guideId),
    );
    return { message: 'Guide content', data };
  }

  @ApiOperation({
    summary: 'Get presentation content',
    description:
      'Retrieves the content of a specific presentation for viewing.',
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
        message: { type: 'string', example: 'Presentation content' },
        data: {
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
                  content: { type: 'string', example: 'Slide content...' },
                  order: { type: 'number', example: 1 },
                  slideType: { type: 'string', example: 'TITLE' },
                },
              },
            },
            totalSlides: { type: 'number', example: 25 },
            estimatedDuration: { type: 'number', example: 1800 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 404,
    description: 'Presentation not found',
  })
  @Get('presentations/:presentationId/content')
  async getPresentationContent(
    @Param('presentationId') presentationId: string,
  ) {
    const data = await firstValueFrom(
      this.readerService.getPresentationContent(presentationId),
    );
    return { message: 'Presentation content', data };
  }

  @ApiOperation({
    summary: 'Update book progress',
    description:
      'Updates the reading progress of a book for the authenticated user including current page and completion status.',
  })
  @ApiParam({
    name: 'bookId',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book progress updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Progress updated' },
        data: {
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
  @Post('books/:bookId/progress')
  @HttpCode(200)
  async updateBookProgress(
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReaderBookProgressDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const doc = await firstValueFrom(
      this.readerService.updateBookProgress(bookId, userId, dto),
    );
    return { message: 'Book progress updated successfully', data: doc };
  }

  @ApiOperation({
    summary: 'Get my book progress',
    description:
      'Retrieves the reading progress of a specific book for the authenticated user.',
  })
  @ApiParam({
    name: 'bookId',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book progress retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'My progress' },
        data: {
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
            bookmarks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 50 },
                  note: { type: 'string', example: 'Important section about closures' },
                  createdAt: { type: 'string', example: '2023-01-10T00:00:00.000Z' },
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
  @ApiResponse({
    status: 404,
    description: 'Book or progress not found',
  })
  @Get('books/:bookId/progress/me')
  async getMyBookProgress(
    @Param('bookId') bookId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    const data = await firstValueFrom(
      this.readerService.getMyBookProgress(bookId, userId),
    );
    return { message: 'Book progress retrieved successfully', data };
  }
}
