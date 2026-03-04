/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedbackGatewayService } from './feedback.service';
import {
  FeedbackDto,
  FeedbackAddMessageDto,
  FeedbackUpdateStatusDto,
} from './dto/feedback.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Feedback Management')
@ApiBearerAuth()
@Controller('api/v1/feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackGatewayController {
  constructor(private readonly feedbackService: FeedbackGatewayService) { }

  @ApiOperation({
    summary: 'Create new feedback',
    description:
      'Creates a new feedback submission with various types and content.',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        feedbackType: { type: 'string', example: 'bug-report' },
        userBugReport: {
          type: 'string',
          example: 'The application crashes when uploading files.',
        },
        status: { type: 'string', example: 'open' },
        email: { type: 'string', example: 'user@example.com' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid feedback data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Post('user/:userId')
  async create(
    @Param('userId') userId: string,
    @Body() createFeedbackDto: FeedbackDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(
      this.feedbackService.create(createFeedbackDto, req.user._id),
    );
  }

  @ApiOperation({
    summary: 'Get all user feedback',
    description:
      'Retrieves all feedback submissions for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback list retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          feedbackType: { type: 'string', example: 'bug-report' },
          status: { type: 'string', example: 'open' },
          email: { type: 'string', example: 'user@example.com' },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get('user/:userId')
  async findAll(@Param('userId') userId: string, @Request() req: any) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(this.feedbackService.findAll(req.user._id));
  }

  @ApiOperation({
    summary: 'Get feedback by ID',
    description:
      'Retrieves a specific feedback submission by its ID for the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the feedback',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        feedbackType: { type: 'string', example: 'bug-report' },
        userBugReport: {
          type: 'string',
          example: 'The application crashes when uploading files.',
        },
        status: { type: 'string', example: 'open' },
        email: { type: 'string', example: 'user@example.com' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get('user/:userId/:id')
  async findOne(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(this.feedbackService.findOne(req.user._id, id));
  }

  @ApiOperation({
    summary: 'Update feedback by ID',
    description:
      'Updates an existing feedback submission with new data. Only the feedback owner can modify their feedback.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the feedback to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        feedbackType: { type: 'string', example: 'bug-report' },
        userBugReport: {
          type: 'string',
          example: 'The application crashes when uploading files.',
        },
        status: { type: 'string', example: 'open' },
        email: { type: 'string', example: 'user@example.com' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid feedback data',
  })
  @Patch('user/:userId/:id')
  async update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() updateFeedbackDto: FeedbackDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(
      this.feedbackService.update(userId, id, updateFeedbackDto),
    );
  }

  @ApiOperation({
    summary: 'Delete feedback by ID',
    description:
      'Permanently deletes a specific feedback submission. This action cannot be undone. Only the feedback owner can delete their feedback.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Feedback deleted successfully' },
        deletedId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid feedback ID',
  })
  @Delete('user/:userId')
  async remove(
    @Param('userId') userId: string,
    @Body('id') id: string,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(this.feedbackService.remove(userId, id));
  }

  @ApiOperation({
    summary: 'Add message to feedback thread',
    description:
      'Adds a new message to an existing feedback submission, creating a conversation thread. Useful for follow-up communications and additional context.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the feedback',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Message added successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        feedbackId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        message: {
          type: 'string',
          example: 'Thank you for addressing my previous concern.',
        },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid message data',
  })
  @Post('user/:userId/:id/messages')
  async createMessage(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() body: FeedbackAddMessageDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(
      this.feedbackService.createMessage(req.user._id, id, body.message),
    );
  }

  @ApiOperation({
    summary: 'Get feedback messages',
    description:
      'Retrieves all messages associated with a specific feedback submission, providing the complete conversation history.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the feedback',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          feedbackId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          message: {
            type: 'string',
            example: 'Thank you for addressing my previous concern.',
          },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get('user/:userId/:id/messages')
  async findOneMessages(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(
      this.feedbackService.findOneMessages(req.user._id, id),
    );
  }

  @ApiOperation({
    summary: 'Update feedback status',
    description:
      'Updates the status of a feedback submission. Used to track the progress and resolution state of feedback items.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the feedback',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback status updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        feedbackType: { type: 'string', example: 'bug-report' },
        status: { type: 'string', example: 'resolved' },
        email: { type: 'string', example: 'user@example.com' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Feedback not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid status value',
  })
  @Patch('user/:userId/:id/status')
  async updateStatus(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() body: FeedbackUpdateStatusDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own feedback',
      );
    }
    return firstValueFrom(
      this.feedbackService.updateStatus(req.user._id, id, body.status),
    );
  }
}
