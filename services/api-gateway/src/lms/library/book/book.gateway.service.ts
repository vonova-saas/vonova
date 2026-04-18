import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateBookDto,
  UpdateBookDto,
  PublishBookDto,
  GetBooksQueryDto,
  UpdateBookProgressDto,
} from './dto/book.dto';

@Injectable()
export class BookGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createBook(dto: CreateBookDto, userId: string) {
    return this.client.send({ cmd: 'book.create' }, { dto, userId });
  }

  publishBook(id: string, dto: PublishBookDto, userId: string) {
    return this.client.send({ cmd: 'book.publish' }, { id, dto, userId });
  }

  getBooks(query: GetBooksQueryDto) {
    const topicsArray = query.topics ? query.topics.split(',') : undefined;
    return this.client.send(
      { cmd: 'book.getAll' },
      { ...query, topics: topicsArray },
    );
  }

  getBookById(id: string) {
    return this.client.send({ cmd: 'book.getById' }, { id });
  }

  getBookBySlug(slug: string) {
    return this.client.send({ cmd: 'book.getBySlug' }, { slug });
  }

  updateBook(id: string, dto: UpdateBookDto, userId: string) {
    return this.client.send({ cmd: 'book.update' }, { id, dto, userId });
  }

  updateBookProgress(
    bookId: string,
    userId: string,
    body: UpdateBookProgressDto,
  ) {
    return this.client.send(
      { cmd: 'book.updateProgress' },
      { bookId, userId, body },
    );
  }

  deleteBook(id: string, userId: string) {
    return this.client.send({ cmd: 'book.delete' }, { id, userId });
  }
}
