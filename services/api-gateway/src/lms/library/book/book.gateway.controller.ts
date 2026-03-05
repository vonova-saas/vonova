/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
@UseGuards(JwtAuthGuard)
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
  @Post('createBook')
  async createBook(@Body() dto: CreateBookDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.createBook(dto, userId));
  }

  @Patch(':id/publish')
  async publishBook(
    @Param('id') id: string,
    @Body() dto: PublishBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.publishBook(id, dto, userId));
  }

  @Get()
  async getBooks(@Query() query: GetBooksQueryDto) {
    return firstValueFrom(this.bookService.getBooks(query));
  }

  @Get(':id')
  async getBookById(@Param('id') id: string) {
    return firstValueFrom(this.bookService.getBookById(id));
  }

  @Get('slug/:slug')
  async getBookBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.bookService.getBookBySlug(slug));
  }

  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.updateBook(id, dto, userId));
  }

  @Patch(':id/progress')
  async updateBookProgress(
    @Param('id') bookId: string,
    @Body() body: UpdateBookProgressDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.bookService.updateBookProgress(bookId, userId, body),
    );
  }

  @Delete(':id')
  async deleteBook(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.deleteBook(id, userId));
  }
}
