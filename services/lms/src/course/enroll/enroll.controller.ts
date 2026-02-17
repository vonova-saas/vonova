import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { EnrollService } from './enroll.service';
import { EnrollCourseDto } from './dto/enroll.dto';

@Controller('courses')
export class EnrollController {
  constructor(private readonly enrollService: EnrollService) {}

  @Post(':courseId/enroll')
  enroll(@Param('courseId') courseId: string, @Body() dto: EnrollCourseDto) {
    const userId = 'mockUserId'; 
    return this.enrollService.enrollCourse(courseId, userId, dto.couponCode);
  }

  @Get(':courseId/enrollment/me')
  getEnrollment(@Param('courseId') courseId: string) {
    const userId = 'mockUserId';
    return this.enrollService.getEnrollment(courseId, userId);
  }

  @Get(':courseId/lessons/:lessonId/access')
  getAccess(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const userId = 'mockUserId';
    return this.enrollService.getLessonAccess(courseId, lessonId, userId);
  }
}
