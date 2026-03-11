import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
  PaginationDto,
} from './dto/chapter.dto';

@Injectable()
export class ChapterGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createChapter(courseId: string, dto: CreateChapterDto, createdBy: string) {
    return this.client.send(
      { cmd: 'app.courses.chapters.create' },
      { courseId, dto, createdBy, user: { id: createdBy } },
    );
  }

  updateChapter(courseId: string, chapterId: string, dto: UpdateChapterDto, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.chapters.update' },
      { courseId, chapterId, dto, ownerId, user: { id: ownerId } },
    );
  }

  deleteChapter(courseId: string, chapterId: string, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.chapters.delete' },
      { courseId, chapterId, ownerId, user: { id: ownerId } },
    );
  }

  reorderChapters(courseId: string, dto: ReorderChaptersDto, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.chapters.reorder' },
      { courseId, dto, ownerId, user: { id: ownerId } },
    );
  }

  getAllChapters(courseId: string, pagination: PaginationDto) {
    return this.client.send(
      { cmd: 'app.courses.chapters.getAll' },
      { courseId, pagination },
    );
  }

  getChapterById(courseId: string, chapterId: string) {
    return this.client.send(
      { cmd: 'app.courses.chapters.getById' },
      { courseId, chapterId },
    );
  }
}
