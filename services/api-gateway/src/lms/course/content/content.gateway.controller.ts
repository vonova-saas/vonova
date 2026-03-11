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
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(
      this.contentService.getCourseContentTree(courseId, userId),
    );
  }

  @ApiOperation({
    summary: 'Get lesson content',
    description:
      'Retrieves the content of a specific lesson for the authenticated user based on their enrollment and access rights.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The unique identifier of the lesson',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: {
          type: 'string',
          example: 'Introduction to JavaScript Variables',
        },
        content: {
          type: 'string',
          example: 'Lesson content including text, video URLs, and resources...',
        },
        type: { type: 'string', example: 'VIDEO' },
        durationMinutes: { type: 'number', example: 45 },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'PDF' },
              title: { type: 'string', example: 'JavaScript Cheat Sheet' },
              url: { type: 'string', example: 'https://example.com/resource.pdf' },
            },
          },
        },
        isCompleted: { type: 'boolean', example: false },
        progress: { type: 'number', example: 0.3 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to lesson content',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, lesson, or content not found',
  })
  @Get('lessons/:lessonId/content')
  async getLessonContent(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    
    if (!userId) {
      throw new Error('Authentication required - No user found');
    }
    
    return firstValueFrom(
      this.contentService.getLessonContent(courseId, lessonId, userId),
    );
  }
}
