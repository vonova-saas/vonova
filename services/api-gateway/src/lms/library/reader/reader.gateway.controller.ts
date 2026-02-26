import { Controller, Get, Post, Param, Body, Request, HttpCode, UseGuards } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ReaderGatewayService } from './reader.gateway.service';
import { UpdateBookProgressDto } from './dto/reader.dto';

@Controller('api/v1/lms/library')
@UseGuards(JwtAuthGuard)
export class ReaderGatewayController {
  constructor(private readonly readerService: ReaderGatewayService) {}

  // GET /library/books/:bookId/content
  @Get('books/:bookId/content')
  async getBookContent(@Param('bookId') bookId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const data = await firstValueFrom(this.readerService.getBookContent(bookId, userId));
    return { message: 'Book content', data };
  }

  @Get('guides/:guideId/content')
  async getGuideContent(@Param('guideId') guideId: string) {
    const data = await firstValueFrom(this.readerService.getGuideContent(guideId));
    return { message: 'Guide content', data };
  }

  @Get('presentations/:presentationId/content')
  async getPresentationContent(@Param('presentationId') presentationId: string) {
    const data = await firstValueFrom(this.readerService.getPresentationContent(presentationId));
    return { message: 'Presentation content', data };
  }

  @Post('books/:bookId/progress')
  @HttpCode(200)
  async updateBookProgress(@Param('bookId') bookId: string, @Body() dto: UpdateBookProgressDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const doc = await firstValueFrom(this.readerService.updateBookProgress(bookId, userId, dto));
    return { message: 'Progress updated', data: doc };
  }

  @Get('books/:bookId/progress/me')
  async getMyBookProgress(@Param('bookId') bookId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const data = await firstValueFrom(this.readerService.getMyBookProgress(bookId, userId));
    return { message: 'My progress', data };
  }
}
