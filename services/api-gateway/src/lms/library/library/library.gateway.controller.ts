import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LibraryGatewayService } from './library.gateway.service';
import { GetAllByTypeQueryDto, GetTopicsQueryDto, TopicsResponseDto, LibraryTopics, TotalMaterialsResponseDto } from './dto';

@ApiTags('LMS Library')
@ApiBearerAuth()
@Controller('api/v1/lms/library')
@UseGuards(JwtAuthGuard)
export class LibraryGatewayController {
  constructor(private readonly libraryService: LibraryGatewayService) {}

  @ApiOperation({
    summary: 'Get all library items by type',
    description:
      'Retrieves all library items (books, guides, presentations) with optional filtering by type. If no type is specified, returns all items from all collections.',
  })
  @ApiResponse({
    status: 200,
    description: 'Library items retrieved successfully',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['book', 'guide', 'presentation'],
    description: 'Filter by content type',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query for title, summary, and description',
  })
  @ApiQuery({
    name: 'topics',
    required: false,
    description: 'Filter by topics (comma-separated)',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    description: 'Filter by difficulty level',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['title', 'createdAt', 'updatedAt', 'views', 'rating'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    description: 'Filter by status',
  })
  @Get()
  async getAllByType(@Query() query: GetAllByTypeQueryDto, @Request() req: any) {
    return this.libraryService.getAllByType(query);
  }

  @ApiOperation({
    summary: 'Get available topics',
    description:
      'Retrieves all available library topics with optional filtering by content type and other parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Topics retrieved successfully',
    type: TopicsResponseDto,
  })
  @ApiQuery({
    name: 'topic',
    required: false,
    enum: LibraryTopics,
    description: 'Filter by specific topic',
  })
  @ApiQuery({
    name: 'topics',
    required: false,
    description: 'Filter by multiple topics (comma-separated)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['book', 'guide', 'presentation'],
    description: 'Filter by content type',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query for title, summary, and description',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    description: 'Filter by difficulty level',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['title', 'createdAt', 'updatedAt', 'views', 'rating'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    description: 'Filter by status',
  })
  @Get('topics')
  async getTopics(@Query() query: GetTopicsQueryDto, @Request() req: any) {
    return this.libraryService.getTopics(query);
  }

  @ApiOperation({
    summary: 'Get total count of all materials',
    description:
      'Retrieves the total count of books, guides, and presentations in the library with percentage breakdown by type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total materials count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 55 },
        books: { type: 'number', example: 25 },
        guides: { type: 'number', example: 20 },
        presentations: { type: 'number', example: 10 },
        breakdown: {
          type: 'object',
          properties: {
            books: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 25 },
                percentage: { type: 'string', example: '45.45' }
              }
            },
            guides: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 20 },
                percentage: { type: 'string', example: '36.36' }
              }
            },
            presentations: {
              type: 'object',
              properties: {
                count: { type: 'number', example: 10 },
                percentage: { type: 'string', example: '18.18' }
              }
            }
          }
        }
      }
    },
  })
  @Get('total')
  async getTotalMaterials(@Request() req: any) {
    return this.libraryService.getTotalMaterials();
  }
}
