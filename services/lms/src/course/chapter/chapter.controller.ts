import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChapterService } from './chapter.service';
import { CreateChapterDto, UpdateChapterDto, ReorderChaptersDto } from './dto/chapter.dto';

@Controller()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @MessagePattern({ cmd: 'app.courses.chapters.create' })
  createChapter(@Payload() data: { courseId: string; dto: CreateChapterDto }) {
    const { courseId, dto } = data;
    if (!courseId || !dto) throw new Error('courseId and dto are required');

    return this.chapterService.createChapter(courseId, dto);
  }

  @MessagePattern({ cmd: 'app.courses.chapters.update' })
  updateChapter(@Payload() data: { courseId: string; chapterId: string; dto: UpdateChapterDto }) {
    const { courseId, chapterId, dto } = data;
    if (!courseId || !chapterId || !dto) throw new Error('courseId, chapterId and dto are required');

    return this.chapterService.updateChapter(courseId, chapterId, dto);
  }

//   @MessagePattern({ cmd: 'app.courses.chapters.reorder' })
//   reorderChapters(@Payload() data: { courseId: string; dto: ReorderChaptersDto }) {
//     const { courseId, dto } = data;
//     return this.chapterService.reorderChapters(courseId, dto.order);
//   }

  @MessagePattern({ cmd: 'app.courses.chapters.delete' })
  deleteChapter(@Payload() data: { courseId: string; chapterId: string }) {
    const { courseId, chapterId } = data;
    if (!courseId || !chapterId) throw new Error('courseId and chapterId are required');

    return this.chapterService.deleteChapter(courseId, chapterId);
  }
}