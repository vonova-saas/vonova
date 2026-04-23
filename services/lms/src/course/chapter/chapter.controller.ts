import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChapterService } from './chapter.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
} from './dto/chapter.dto';

@Controller()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @MessagePattern({ cmd: 'app.courses.chapters.create' })
  createChapter(
    @Payload()
    data: {
      courseId: string;
      dto: CreateChapterDto;
      createdBy?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, dto, createdBy, user } = data;
    if (!courseId || !dto) throw new Error('courseId and dto are required');

    // Extract createdBy from multiple possible sources
    const userId = createdBy || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.chapterService.createChapter(courseId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.chapters.update' })
  updateChapter(
    @Payload()
    data: {
      courseId: string;
      chapterId: string;
      dto: UpdateChapterDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, chapterId, dto, ownerId, user } = data;
    if (!courseId || !chapterId || !dto)
      throw new Error('courseId, chapterId and dto are required');

    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.chapterService.updateChapter(courseId, chapterId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.chapters.reorder' })
  reorderChapters(
    @Payload()
    data: {
      courseId: string;
      dto: ReorderChaptersDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, dto, ownerId, user } = data;
    console.log('Reorder chapters payload:', JSON.stringify(data, null, 2));

    if (!courseId || !dto) {
      console.error('Missing required fields:', { courseId, dto });
      throw new Error('courseId and dto are required');
    }

    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) {
      console.error('Missing user identification:', { ownerId, user });
      throw new Error('User identification is required');
    }

    console.log('Processing reorder:', { courseId, order: dto.order, userId });
    return this.chapterService.reorderChapters(courseId, dto.order, userId);
  }

  @MessagePattern({ cmd: 'app.courses.chapters.delete' })
  deleteChapter(
    @Payload()
    data: {
      courseId: string;
      chapterId: string;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, chapterId, ownerId, user } = data;
    if (!courseId || !chapterId)
      throw new Error('courseId and chapterId are required');

    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.chapterService.deleteChapter(courseId, chapterId, userId);
  }

  @MessagePattern({ cmd: 'app.courses.chapters.getAll' })
  getAllChapters(
    @Payload()
    data: {
      courseId: string;
      pagination: { page?: number; limit?: number };
    },
  ) {
    const { courseId, pagination } = data;
    if (!courseId) throw new Error('courseId is required');

    return this.chapterService.getAllChapters(courseId, pagination || {});
  }

  @MessagePattern({ cmd: 'app.courses.chapters.getById' })
  getChapterById(@Payload() data: { courseId: string; chapterId: string }) {
    const { courseId, chapterId } = data;
    if (!courseId || !chapterId)
      throw new Error('courseId and chapterId are required');

    return this.chapterService.getChapterById(courseId, chapterId);
  }
}
