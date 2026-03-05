import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CourseService } from './course.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';

@Controller()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @MessagePattern({ cmd: 'app.courses.create' })
  createCourse(@Payload() data: { dto: CreateCourseDto; ownerId: string }) {
    const { dto, ownerId } = data;
    if (!dto || !ownerId) throw new Error('dto and ownerId are required');

    return this.courseService.createCourse(dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.update' })
  updateCourse(
    @Payload()
    data: {
      courseId: string;
      dto: UpdateCourseDto;
      ownerId: string;
    },
  ) {
    const { courseId, dto, ownerId } = data;
    if (!courseId || !dto || !ownerId)
      throw new Error('courseId, dto and ownerId are required');

    return this.courseService.updateCourse(courseId, dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.publish' })
  publishCourse(
    @Payload()
    data: {
      courseId: string;
      dto: PublishCourseDto;
      ownerId: string;
    },
  ) {
    const { courseId, dto, ownerId } = data;
    if (!courseId || !dto || !ownerId)
      throw new Error('courseId, dto and ownerId are required');

    return this.courseService.publishCourse(courseId, dto, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.delete' })
  deleteCourse(@Payload() data: { courseId: string; ownerId: string }) {
    const { courseId, ownerId } = data;
    if (!courseId || !ownerId)
      throw new Error('courseId and ownerId are required');

    return this.courseService.deleteCourse(courseId, ownerId);
  }

  @MessagePattern({ cmd: 'app.courses.recomputeAggregates' })
  recomputeAggregates(@Payload() data: { courseId: string }) {
    const { courseId } = data;
    if (!courseId) throw new Error('courseId is required');

    return this.courseService.computeCourseAggregates(courseId);
  }

  @MessagePattern({ cmd: 'app.courses.getAll' })
  getAllCourses(@Payload() data: any) {
    return this.courseService.getAllCourses(data || {});
  }

  @MessagePattern({ cmd: 'app.courses.getBySlug' })
  getCourseBySlug(@Payload() data: { slug: string }) {
    const { slug } = data;
    if (!slug) throw new Error('slug is required');

    return this.courseService.getCourseBySlug(slug);
  }

  @MessagePattern({ cmd: 'app.courses.getById' })
  getCourseById(@Payload() data: { courseId: string }) {
    const { courseId } = data;
    if (!courseId) throw new Error('courseId is required');

    return this.courseService.getCourseById(courseId);
  }
}
