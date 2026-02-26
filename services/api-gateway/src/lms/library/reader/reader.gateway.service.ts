import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateBookProgressDto } from './dto/reader.dto';

@Injectable()
export class ReaderGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  getBookContent(bookId: string, userId: string) {
    return this.client.send({ cmd: 'library.reader.getBookContent' }, { bookId, userId });
  }

  getGuideContent(guideId: string) {
    return this.client.send({ cmd: 'library.reader.getGuideContent' }, { guideId });
  }

  getPresentationContent(presentationId: string) {
    return this.client.send({ cmd: 'library.reader.getPresentationContent' }, { presentationId });
  }

  updateBookProgress(bookId: string, userId: string, dto: UpdateBookProgressDto) {
    return this.client.send({ cmd: 'library.reader.updateBookProgress' }, { bookId, userId, dto });
  }

  getMyBookProgress(bookId: string, userId: string) {
    return this.client.send({ cmd: 'library.reader.getMyBookProgress' }, { bookId, userId });
  }
}
