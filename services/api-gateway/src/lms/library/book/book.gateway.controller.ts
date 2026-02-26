/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BookGatewayService } from './book.gateway.service';
import {
  CreateBookDto,
  UpdateBookDto,
  PublishBookDto,
  GetBooksQueryDto,
  UpdateBookProgressDto,
} from './dto/book.dto';

@Controller('api/v1/lms/library/books')
@UseGuards(JwtAuthGuard)
export class BookGatewayController {
  constructor(private readonly bookService: BookGatewayService) {}

  @Post('createBook')
  async createBook(
    @Body() dto: CreateBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.createBook(dto, userId));
  }

  @Patch(':id/publish')
  async publishBook(
    @Param('id') id: string,
    @Body() dto: PublishBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.publishBook(id, dto, userId));
  }

  @Get()
  async getBooks(@Query() query: GetBooksQueryDto) {
    return firstValueFrom(this.bookService.getBooks(query));
  }

  @Get(':id')
  async getBookById(@Param('id') id: string) {
    return firstValueFrom(this.bookService.getBookById(id));
  }

  @Get('slug/:slug')
  async getBookBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.bookService.getBookBySlug(slug));
  }

  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.updateBook(id, dto, userId));
  }

  @Patch(':id/progress')
  async updateBookProgress(
    @Param('id') bookId: string,
    @Body() body: UpdateBookProgressDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.updateBookProgress(bookId, userId, body));
  }

  @Delete(':id')
  async deleteBook(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.bookService.deleteBook(id, userId));
  }
}
