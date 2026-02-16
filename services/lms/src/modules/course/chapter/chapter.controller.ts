import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto, UpdateChapterDto, ReorderChaptersDto } from './dto/chapter.dto';

@Controller('courses/:courseId/chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  createChapter(
    @Param('courseId') courseId: string,
    @Body() dto: CreateChapterDto,
  ) {
    return this.chapterService.createChapter(courseId, dto);
  }

  @Patch(':chapterId')
  updateChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.chapterService.updateChapter(courseId, chapterId, dto);
  }

//   @Patch('reorder')
//   reorderChapters(
//     @Param('courseId') courseId: string,
//     @Body() dto: ReorderChaptersDto,
//   ) {
//     return this.chapterService.reorderChapters(courseId, dto.order);
//   }

  @Delete(':chapterId')
  deleteChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.chapterService.deleteChapter(courseId, chapterId);
  }
}
