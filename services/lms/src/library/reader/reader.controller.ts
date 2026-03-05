import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReaderService } from './reader.service';
import { UpdateBookProgressDto } from './dto/reader.dto';

@Controller()
export class ReaderController {
  constructor(private readonly readerService: ReaderService) {}

  @MessagePattern({ cmd: 'library.reader.getBookContent' })
  async getBookContent(@Payload() data: { bookId: string; userId: string }) {
    const { bookId, userId } = data;
    if (!bookId || !userId) throw new Error('bookId and userId are required');

    const result = await this.readerService.getBookContent(bookId, userId);
    return { message: 'Book content', data: result };
  }

  @MessagePattern({ cmd: 'library.reader.getGuideContent' })
  async getGuideContent(@Payload() data: { guideId: string }) {
    const { guideId } = data;
    if (!guideId) throw new Error('guideId is required');

    const result = await this.readerService.getGuideContent(guideId);
    return { message: 'Guide content', data: result };
  }

  @MessagePattern({ cmd: 'library.reader.getPresentationContent' })
  async getPresentationContent(@Payload() data: { presentationId: string }) {
    const { presentationId } = data;
    if (!presentationId) throw new Error('presentationId is required');

    const result =
      await this.readerService.getPresentationContent(presentationId);
    return { message: 'Presentation content', data: result };
  }

  @MessagePattern({ cmd: 'library.reader.updateBookProgress' })
  async updateBookProgress(
    @Payload()
    data: {
      bookId: string;
      userId: string;
      dto: UpdateBookProgressDto;
    },
  ) {
    const { bookId, userId, dto } = data;
    if (!bookId || !userId || !dto)
      throw new Error('bookId, userId and dto are required');

    const result = await this.readerService.updateBookProgress(
      bookId,
      userId,
      dto as any,
    );
    return { message: 'Progress updated', data: result };
  }

  @MessagePattern({ cmd: 'library.reader.getMyBookProgress' })
  async getMyBookProgress(@Payload() data: { bookId: string; userId: string }) {
    const { bookId, userId } = data;
    if (!bookId || !userId) throw new Error('bookId and userId are required');

    const result = await this.readerService.getMyBookProgress(bookId, userId);
    return { message: 'My progress', data: result };
  }
}
