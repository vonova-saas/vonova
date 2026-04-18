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
  createBook(@Payload() data: { dto: CreateBookDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { dto, userId, user } = data;
    if (!dto) throw new Error('dto is required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.bookService.createBookService(dto, createdBy);
  }

  @MessagePattern({ cmd: 'book.publish' })
  publishBook(@Payload() data: { id: string; dto: PublishBookDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, dto, userId, user } = data;
    if (!id || !dto) throw new Error('id and dto are required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.bookService.publishBookService(id, dto, createdBy);
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
  updateBook(@Payload() data: { id: string; dto: UpdateBookDto; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, dto, userId, user } = data;
    if (!id || !dto) throw new Error('id and dto are required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.bookService.updateBookService(id, dto, createdBy);
  }

  @MessagePattern({ cmd: 'book.updateProgress' })
  updateBookProgress(@Payload() data: { bookId: string; userId?: string; user?: { id?: string; sub?: string; _id?: string }; body: UpdateProgressDto }) {
    const { bookId, userId, user, body } = data;
    if (!bookId || !body) throw new Error('bookId and body are required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.bookService.updateBookProgressService(bookId, createdBy, body);
  }

  @MessagePattern({ cmd: 'book.delete' })
  deleteBook(@Payload() data: { id: string; userId?: string; user?: { id?: string; sub?: string; _id?: string } }) {
    const { id, userId, user } = data;
    if (!id) throw new Error('id is required');
    
    // Extract userId from multiple possible sources
    const createdBy = userId || user?.id || user?.sub || user?._id;
    if (!createdBy) throw new Error('User identification is required');

    return this.bookService.deleteBookService(id, createdBy);
  }
}
