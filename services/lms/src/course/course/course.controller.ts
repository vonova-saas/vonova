import { Controller, Post, Patch, Delete, Get, Param, Query, Body } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto, PublishCourseDto } from './dto/course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('createCourse')
  createCourse(@Body() dto: CreateCourseDto) {

    return this.courseService.createCourse(dto, 'ownerId_placeholder');
  }

  @Patch(':courseId')
  updateCourse(@Param('courseId') courseId: string, @Body() dto: UpdateCourseDto) {
    return this.courseService.updateCourse(courseId, dto, 'ownerId_placeholder');
  }

  @Patch('publish/:courseId')
  publishCourse(@Param('courseId') courseId: string, @Body() dto: PublishCourseDto) {
    return this.courseService.publishCourse(courseId, dto, 'ownerId_placeholder');
  }

  @Delete(':courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return this.courseService.deleteCourse(courseId, 'ownerId_placeholder');
  }

  @Post(':courseId/recompute-aggregates')
  recomputeAggregates(@Param('courseId') courseId: string) {
    return this.courseService.computeCourseAggregates(courseId);
  }

  @Get()
  getAllCourses(@Query() query) {
    return this.courseService.getAllCourses(query);
  }

  @Get('slug/:slug')
  getCourseBySlug(@Param('slug') slug: string) {
    return this.courseService.getCourseBySlug(slug);
  }

  @Get(':courseId')
  getCourseById(@Param('courseId') courseId: string) {
    return this.courseService.getCourseById(courseId);
  }


}
