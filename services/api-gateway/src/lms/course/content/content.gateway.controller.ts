/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContentGatewayService } from './content.gateway.service';

@ApiTags('LMS Course Content')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/content')
@UseGuards(JwtAuthGuard)
export class ContentGatewayController {
  constructor(private readonly contentService: ContentGatewayService) {}

  @ApiOperation({
    summary: 'Get course content tree',
    description:
      'Retrieves the complete content structure of a course including chapters and lessons.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course content tree retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        chapters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Introduction to JavaScript' },
              index: { type: 'number', example: 0 },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    title: {
                      type: 'string',
                      example: 'Variables and Data Types',
                    },
                    index: { type: 'number', example: 0 },
                    content: {
                      type: 'string',
                      example: 'Lesson content here...',
                    },
                    duration: { type: 'number', example: 1800 },
                  },
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
    description: 'Course not found',
  })
  @Get()
  async getCourseContentTree(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.contentService.getCourseContentTree(courseId, userId),
    );
  }

  @Get('lessons/:lessonId/content')
  async getLessonContent(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(
      this.contentService.getLessonContent(courseId, lessonId, userId),
    );
  }
}
