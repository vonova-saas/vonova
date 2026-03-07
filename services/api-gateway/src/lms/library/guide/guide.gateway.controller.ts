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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GuideGatewayService } from './guide.gateway.service';
import {
  CreateGuideDto,
  UpdateGuideDto,
  PublishGuideDto,
} from './dto/guide.dto';

@ApiTags('LMS Library Guides')
@ApiBearerAuth()
@Controller('api/v1/lms/library/guides')
@UseGuards(JwtAuthGuard)
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
  @Post()
  async createGuide(@Body() dto: CreateGuideDto, @Request() _req: any) {
    return firstValueFrom(this.guideService.createGuide(dto));
  }

  @Get()
  async listGuides(
    @Query('q') q?: string,
    @Query('topics') topics?: string,
    @Query('level') level?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
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
      }),
    );
  }

  @Get(':id')
  async getGuideById(@Param('id') id: string) {
    return firstValueFrom(this.guideService.getGuideById(id));
  }

  @Get('slug/:slug')
  async getGuideBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.guideService.getGuideBySlug(slug));
  }

  @Patch(':id')
  async updateGuide(
    @Param('id') id: string,
    @Body() dto: UpdateGuideDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.guideService.updateGuide(id, dto));
  }

  @Patch(':id/publish')
  async publishGuide(
    @Param('id') id: string,
    @Body() dto: PublishGuideDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.guideService.publishGuide(id, dto));
  }

  @Delete(':id')
  async deleteGuide(@Param('id') id: string, @Request() _req: any) {
    return firstValueFrom(this.guideService.deleteGuide(id));
  }
}
