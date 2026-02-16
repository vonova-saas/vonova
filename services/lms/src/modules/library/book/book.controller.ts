import { Controller, Post, Patch, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto, UpdateBookDto, PublishBookDto, GetBooksQueryDto, UpdateProgressDto } from './dto/book.dto';

@Controller('/library/book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('createBook')
  createBook(@Body() body: CreateBookDto) {
    return this.bookService.createBookService(body, 'USER_ID'); // replace with Auth later
  }

  @Patch('publishBook/:id')
  publishBook(@Param('id') id: string, @Body() body: PublishBookDto) {
    return this.bookService.publishBookService(id, body, 'USER_ID'); // replace with Auth later
  }

  @Get('getAllBooks')
  getBooks(@Query() query: GetBooksQueryDto) {
    const topicsArray = query.topics ? query.topics.split(',') : undefined;
    return this.bookService.getBooksService({ ...query, topics: topicsArray });
  }

  @Get('getBookById/:id')
  getBookById(@Param('id') id: string) {
    return this.bookService.getBookByIdService(id);
  }

  @Get('slug/:slug')
  getBookBySlug(@Param('slug') slug: string) {
    return this.bookService.getBookBySlugService(slug);
  }

  @Patch('updateBook/:id')
  updateBook(@Param('id') id: string, @Body() body: UpdateBookDto) {
    return this.bookService.updateBookService(id, body, 'USER_ID'); // replace with Auth later
  }

  @Post(':bookId/progress')
  updateBookProgress(@Param('bookId') bookId: string, @Body() body: UpdateProgressDto) {
    return this.bookService.updateBookProgressService(bookId, 'USER_ID', body); // replace with Auth later
  }

  @Delete('deleteBook/:id')
  deleteBook(@Param('id') id: string) {
    return this.bookService.deleteBookService(id, 'USER_ID'); // replace with Auth later
  }
}
