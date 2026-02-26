/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ProgressGatewayService } from './progress.gateway.service';
import { MarkLessonCompleteDto } from './dto/progress.dto';

@Controller('api/v1/lms/courses/:courseId')
@UseGuards(JwtAuthGuard)
export class ProgressGatewayController {
  constructor(private readonly progressService: ProgressGatewayService) {}

  @Patch('lessons/:lessonId/complete')
  async markLessonComplete(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkLessonCompleteDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.progressService.markLessonComplete(courseId, lessonId, userId, dto));
  }

  @Get('progress/me')
  async getMyCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.progressService.getMyCourseProgress(courseId, userId));
  }
}
