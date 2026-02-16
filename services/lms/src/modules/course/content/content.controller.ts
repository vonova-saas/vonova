import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('courses')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('/:courseId/content')
  async getCourseContentTree(
    @Param('courseId') courseId: string,
  ) {
  
    const userId = 'TEMP_USER';
    return this.contentService.getCourseContentTree(courseId, userId);
  }

  @Get('/:courseId/lessons/:lessonId/content')
  async getLessonContent(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const userId = 'TEMP_USER';
    return this.contentService.getLessonContent(courseId, lessonId, userId);
  }
}
