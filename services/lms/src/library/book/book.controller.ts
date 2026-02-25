import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookService } from './book.service';
import {
  CreateBookDto,
  UpdateBookDto,
  PublishBookDto,
  GetBooksQueryDto,
  UpdateProgressDto,
} from './dto/book.dto';

@Controller('/library/book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @MessagePattern({ cmd: 'book.create' })
  createBook(@Payload() body: CreateBookDto) {
    return this.bookService.createBookService(body, 'USER_ID'); // replace with Auth later
  }

  @MessagePattern({ cmd: 'book.publish' })
  publishBook(
    @Payload('id') id: string,
    @Payload('dto') body: PublishBookDto,
  ) {
    return this.bookService.publishBookService(id, body, 'USER_ID'); // replace with Auth later
  }

  @MessagePattern({ cmd: 'book.getAll' })
  getBooks(@Payload() query: GetBooksQueryDto) {
    const topicsArray = query.topics ? query.topics.split(',') : undefined;
    return this.bookService.getBooksService({ ...query, topics: topicsArray });
  }

  @MessagePattern({ cmd: 'book.getById' })
  getBookById(@Payload('id') id: string) {
    return this.bookService.getBookByIdService(id);
  }

  @MessagePattern({ cmd: 'book.getBySlug' })
  getBookBySlug(@Payload('slug') slug: string) {
    return this.bookService.getBookBySlugService(slug);
  }

  @MessagePattern({ cmd: 'book.update' })
  updateBook(
    @Payload('id') id: string,
    @Payload('dto') body: UpdateBookDto,
  ) {
    return this.bookService.updateBookService(id, body, 'USER_ID'); // replace with Auth later
  }

  @MessagePattern({ cmd: 'book.updateProgress' })
  updateBookProgress(
    @Payload('bookId') bookId: string,
    @Payload('body') body: UpdateProgressDto,
  ) {
    return this.bookService.updateBookProgressService(bookId, 'USER_ID', body); // replace with Auth later
  }

  @MessagePattern({ cmd: 'book.delete' })
  deleteBook(@Payload('id') id: string) {
    return this.bookService.deleteBookService(id, 'USER_ID'); // replace with Auth later
  }
}
