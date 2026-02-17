import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto, ReorderLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { Types } from 'mongoose';

@Controller('courses/:courseId')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post('chapter/:chapterId/lessons')
  createLesson(
    @Param('courseId') courseId: Types.ObjectId,
    @Param('chapterId') chapterId: Types.ObjectId,
    @Body() dto: CreateLessonDto,
  ) {
    
    const ownerId = 'owner-placeholder';
    return this.lessonService.createLesson(courseId, chapterId, dto, ownerId);
  }

  @Patch('chapter/:chapterId/lessons/:lessonId')
  updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    const ownerId = 'owner-placeholder';
    return this.lessonService.updateLesson(courseId, lessonId, dto, ownerId);
  }

  @Patch('lessons/reorder')
  reorderLessons(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonDto,
  ) {
    const ownerId = 'owner-placeholder';
    return this.lessonService.reorderLessons(courseId, dto, ownerId);
  }

  @Delete('lessons/:lessonId')
  deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const ownerId = 'owner-placeholder';
    return this.lessonService.deleteLesson(courseId, lessonId, ownerId);
  }
}
