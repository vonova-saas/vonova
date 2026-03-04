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
  AddMessageDto,
  UpdateStatusDto,
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
    description: 'Creates a new feedback submission with various types and content.',
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
  @Post()
  async create(@Body() createFeedbackDto: FeedbackDto, @Request() req: any) {
    return firstValueFrom(
      this.feedbackService.create(createFeedbackDto, req.user._id),
    );
  }

  @ApiOperation({
    summary: 'Get all user feedback',
    description: 'Retrieves all feedback submissions for the authenticated user.',
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
  @Get()
  async findAll(@Request() req: any) {
    return firstValueFrom(this.feedbackService.findAll(req.user._id));
  }

  @ApiOperation({
    summary: 'Get feedback by ID',
    description: 'Retrieves a specific feedback submission by its ID for the authenticated user.',
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
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.feedbackService.findOne(req.user._id, id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFeedbackDto: FeedbackDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.update(req.user._id, id, updateFeedbackDto),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.feedbackService.remove(req.user._id, id));
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body('message') message: AddMessageDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.createMessage(req.user._id, id, message),
    );
  }

  @Get(':id/messages')
  async findOneMessages(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.feedbackService.findOneMessages(req.user._id, id),
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UpdateStatusDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.updateStatus(req.user._id, id, status),
    );
  }
}
