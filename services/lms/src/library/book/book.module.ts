import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from '../../../schemas/library/book/book.schema';
import { BookProgress, BookProgressSchema } from '../../../schemas/library/book/book-progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: BookProgress.name, schema: BookProgressSchema },
    ]),
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
