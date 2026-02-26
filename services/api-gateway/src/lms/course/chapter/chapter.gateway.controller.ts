/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChapterGatewayService } from './chapter.gateway.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ReorderChaptersDto,
} from './dto/chapter.dto';

@Controller('api/v1/lms/courses/:courseId/chapters')
@UseGuards(JwtAuthGuard)
export class ChapterGatewayController {
  constructor(private readonly chapterService: ChapterGatewayService) {}

  @Post()
  async createChapter(
    @Param('courseId') courseId: string,
    @Body() dto: CreateChapterDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.createChapter(courseId, dto));
  }

  @Patch(':chapterId')
  async updateChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Body() dto: UpdateChapterDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.updateChapter(courseId, chapterId, dto));
  }

  @Delete(':chapterId')
  async deleteChapter(
    @Param('courseId') courseId: string,
    @Param('chapterId') chapterId: string,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.deleteChapter(courseId, chapterId));
  }

  @Patch('reorder')
  async reorderChapters(
    @Param('courseId') courseId: string,
    @Body() dto: ReorderChaptersDto,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.chapterService.reorderChapters(courseId, dto));
  }
}
