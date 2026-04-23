import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Book, BookSchema } from '../schema/book/book.schema';
import { Guide, GuideSchema } from '../schema/guide.schema';
import { Presentation, PresentationSchema } from '../schema/presentation.schema';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Guide.name, schema: GuideSchema },
      { name: Presentation.name, schema: PresentationSchema },
    ]),
    UploadModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
