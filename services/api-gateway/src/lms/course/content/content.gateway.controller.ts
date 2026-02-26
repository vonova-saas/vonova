/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContentGatewayService } from './content.gateway.service';

@Controller('api/v1/lms/courses/:courseId/content')
@UseGuards(JwtAuthGuard)
export class ContentGatewayController {
  constructor(private readonly contentService: ContentGatewayService) {}

  @Get()
  async getCourseContentTree(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.contentService.getCourseContentTree(courseId, userId));
  }

  @Get('lessons/:lessonId/content')
  async getLessonContent(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.contentService.getLessonContent(courseId, lessonId, userId));
  }
}
