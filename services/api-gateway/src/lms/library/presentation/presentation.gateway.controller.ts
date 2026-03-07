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
import { PresentationGatewayService } from './presentation.gateway.service';
import {
  CreatePresentationDto,
  UpdatePresentationDto,
  PublishPresentationDto,
} from './dto/presentation.dto';

@ApiTags('LMS Library Presentations')
@ApiBearerAuth()
@Controller('api/v1/lms/library/presentation')
@UseGuards(JwtAuthGuard)
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
  @Post('createPresentation')
  async create(@Body() dto: CreatePresentationDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.create(dto, userId));
  }

  @Patch('updatePresentation/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePresentationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.update(id, dto, userId));
  }

  @Patch('publishPresentation/:id')
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishPresentationDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.presentationService.publish(id, dto, userId));
  }

  @Delete('deletePresentation/:presentationId')
  async delete(
    @Param('presentationId') presentationId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.presentationService.delete(presentationId, userId),
    );
  }

  @Get('getAllPresentations')
  async getAll(@Query() query: any) {
    return firstValueFrom(this.presentationService.getAll(query));
  }

  @Get('getPresentationById/:presentationId')
  async getById(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getById(presentationId));
  }

  @Get(':presentationId/content')
  async getContent(@Param('presentationId') presentationId: string) {
    return firstValueFrom(this.presentationService.getContent(presentationId));
  }
}
