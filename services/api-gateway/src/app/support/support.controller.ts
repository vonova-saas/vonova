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
import { SupportGatewayService } from './support.service';
import { SupportDto, AddMessageDto, UpdateStatusDto } from './dto/support.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Support Management')
@ApiBearerAuth()
@Controller('api/v1/support')
@UseGuards(JwtAuthGuard)
export class SupportGatewayController {
  constructor(private readonly supportService: SupportGatewayService) { }

  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Creates a new support ticket for the authenticated user.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Support ticket created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fullName: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        category: { type: 'string', example: 'technical' },
        subject: { type: 'string', example: 'Login issue with my account' },
        message: {
          type: 'string',
          example: 'I am unable to log in to my account.',
        },
        status: { type: 'string', example: 'open' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - User can only create their own support tickets',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid support data',
  })
  @Post('user/:userId')
  async create(
    @Param('userId') userId: string,
    @Body() createSupportDto: SupportDto,
    @Request() req: any,
  ) {
    if (req.user._id !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own support tickets',
      );
    }

    return firstValueFrom(this.supportService.create(createSupportDto, userId));
  }

  @ApiOperation({
    summary: 'Get all support tickets',
    description: 'Retrieves all support tickets for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Support tickets retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          fullName: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john.doe@example.com' },
          category: { type: 'string', example: 'technical' },
          subject: { type: 'string', example: 'Login issue with my account' },
          status: { type: 'string', example: 'open' },
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
    return firstValueFrom(this.supportService.findAll(req.user._id));
  }

  @ApiOperation({
    summary: 'Get support ticket by ID',
    description: 'Retrieves a specific support ticket by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fullName: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        category: { type: 'string', example: 'technical' },
        subject: { type: 'string', example: 'Login issue with my account' },
        message: {
          type: 'string',
          example: 'I am unable to log in to my account.',
        },
        status: { type: 'string', example: 'open' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.supportService.findOne(req.user._id, id));
  }

  @ApiOperation({
    summary: 'Update support ticket',
    description: 'Updates an existing support ticket with new information.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fullName: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        category: { type: 'string', example: 'technical' },
        subject: { type: 'string', example: 'Updated: Login issue with my account' },
        message: {
          type: 'string',
          example: 'Updated message with additional details.',
        },
        status: { type: 'string', example: 'open' },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSupportDto: SupportDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.update(req.user._id, id, updateSupportDto),
    );
  }

  @ApiOperation({
    summary: 'Delete support ticket',
    description: 'Removes a support ticket permanently from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Support ticket deleted successfully' },
        deletedTicket: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            subject: { type: 'string', example: 'Login issue with my account' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.supportService.remove(req.user._id, id));
  }

  @ApiOperation({
    summary: 'Add message to support ticket',
    description: 'Adds a new message to the support ticket conversation thread.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Message added to support ticket successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        ticketId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        message: {
          type: 'string',
          example: 'Thank you for your assistance. The issue has been resolved on my end.',
        },
        isFromSupport: { type: 'boolean', example: false },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Post(':id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() message: AddMessageDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.createMessage(req.user._id, id, message),
    );
  }

  @ApiOperation({
    summary: 'Get support ticket messages',
    description: 'Retrieves all messages in the support ticket conversation thread.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          ticketId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
          message: {
            type: 'string',
            example: 'Thank you for your assistance. The issue has been resolved on my end.',
          },
          isFromSupport: { type: 'boolean', example: false },
          createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Get(':id/messages')
  async findOneMessages(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.supportService.findOneMessages(req.user._id, id),
    );
  }

  @ApiOperation({
    summary: 'Update support ticket status',
    description: 'Updates the status of a support ticket (open, pending, resolved, closed).',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the support ticket',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket status updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        status: { type: 'string', example: 'resolved' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: UpdateStatusDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.supportService.updateStatus(req.user._id, id, status),
    );
  }
}
