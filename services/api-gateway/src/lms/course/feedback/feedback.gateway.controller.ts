import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UnauthorizedException,
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
import { CourseFeedbackGatewayService } from './feedback.gateway.service';
import { AnalyzeCourseFeedbackDto } from './dto/feedback.dto';


@ApiTags('LMS Course Feedback')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/feedback')
@UseGuards(JwtAuthGuard)
export class CourseFeedbackGatewayController {
  constructor(
    private readonly feedbackService: CourseFeedbackGatewayService,
  ) {}

  @ApiOperation({
    summary: 'Analyze course feedback sentiment',
    description:
      'Analyzes enrolled student feedback for a course using an external AI service. Only students enrolled in the course can submit feedback.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The unique identifier of the course',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Sentiment analysis result',
    schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
          example: 'positive',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid feedback text',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only enrolled students can submit course feedback',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @Post('analyze')
  async analyzeFeedback(
    @Param('courseId') courseId: string,
    @Body() dto: AnalyzeCourseFeedbackDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?._id;
    const role = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException('Authentication required - No user found');
    }

    return firstValueFrom(
      this.feedbackService.analyzeFeedback({
        courseId,
        userId,
        role,
        text: dto.text,
      }),
    );
  }
}