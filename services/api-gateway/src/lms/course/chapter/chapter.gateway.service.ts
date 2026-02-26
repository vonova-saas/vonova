import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
} from './dto/chapter.dto';

@Injectable()
export class ChapterGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createChapter(courseId: string, dto: CreateChapterDto) {
    return this.client.send({ cmd: 'app.courses.chapters.create' }, { courseId, dto });
  }

  updateChapter(courseId: string, chapterId: string, dto: UpdateChapterDto) {
    return this.client.send({ cmd: 'app.courses.chapters.update' }, { courseId, chapterId, dto });
  }

  deleteChapter(courseId: string, chapterId: string) {
    return this.client.send({ cmd: 'app.courses.chapters.delete' }, { courseId, chapterId });
  }

  reorderChapters(courseId: string, dto: ReorderChaptersDto) {
    return this.client.send({ cmd: 'app.courses.chapters.reorder' }, { courseId, dto });
  }
}
