/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LessonGatewayService } from './lesson.gateway.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonDto,
} from './dto/lesson.dto';

@Controller('api/v1/lms/courses/:courseId/chapters/:chapterId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonGatewayController {
  constructor(private readonly lessonService: LessonGatewayService) {}

  @Post()
  async createLesson(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: CreateLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.lessonService.createLesson(courseId, chapterId, dto, ownerId));
  }

  @Patch(':lessonId')
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.lessonService.updateLesson(courseId, lessonId, dto, ownerId));
  }

  @Patch('reorder')
  async reorderLessons(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderLessonDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.lessonService.reorderLessons(courseId, dto, ownerId));
  }

  @Delete(':lessonId')
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.lessonService.deleteLesson(courseId, lessonId, ownerId));
  }
}
