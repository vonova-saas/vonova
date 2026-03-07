import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  HttpCode,
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
import { ReaderGatewayService } from './reader.gateway.service';
import { UpdateReaderBookProgressDto } from './dto/reader.dto';

@ApiTags('LMS Library Reader')
@ApiBearerAuth()
@Controller('api/v1/lms/library')
@UseGuards(JwtAuthGuard)
export class ReaderGatewayController {
  constructor(private readonly readerService: ReaderGatewayService) {}

  @ApiOperation({
    summary: 'Get book content',
    description:
      'Retrieves the content of a specific book for the authenticated user.',
  })
  @ApiParam({
    name: 'bookId',
    description: 'The unique identifier of the book',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Book content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Book content' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: {
              type: 'string',
              example: 'JavaScript: The Complete Guide',
            },
            content: { type: 'string', example: 'Book content here...' },
            totalPages: { type: 'number', example: 450 },
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
    description: 'Book not found',
  })
  @Get('books/:bookId/content')
  async getBookContent(@Param('bookId') bookId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const data = await firstValueFrom(
      this.readerService.getBookContent(bookId, userId),
    );
    return { message: 'Book content', data };
  }

  @Get('guides/:guideId/content')
  async getGuideContent(@Param('guideId') guideId: string) {
    const data = await firstValueFrom(
      this.readerService.getGuideContent(guideId),
    );
    return { message: 'Guide content', data };
  }

  @Get('presentations/:presentationId/content')
  async getPresentationContent(
    @Param('presentationId') presentationId: string,
  ) {
    const data = await firstValueFrom(
      this.readerService.getPresentationContent(presentationId),
    );
    return { message: 'Presentation content', data };
  }

  @Post('books/:bookId/progress')
  @HttpCode(200)
  async updateBookProgress(
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReaderBookProgressDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const doc = await firstValueFrom(
      this.readerService.updateBookProgress(bookId, userId, dto),
    );
    return { message: 'Progress updated', data: doc };
  }

  @Get('books/:bookId/progress/me')
  async getMyBookProgress(
    @Param('bookId') bookId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const data = await firstValueFrom(
      this.readerService.getMyBookProgress(bookId, userId),
    );
    return { message: 'My progress', data };
  }
}
