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
  createCourse(@Payload() data: { dto: CreateCourseDto; createdBy?: string; user?: { id?: string; sub?: string } }) {
    const { dto, createdBy, user } = data;
    if (!dto) throw new Error('dto is required');
    
    // Extract createdBy from multiple possible sources
    const userId = createdBy || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.courseService.createCourse(dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.update' })
  updateCourse(
    @Payload()
    data: {
      courseId: string;
      dto: UpdateCourseDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, dto, ownerId, user } = data;
    if (!courseId || !dto) throw new Error('courseId and dto are required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.courseService.updateCourse(courseId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.publish' })
  publishCourse(
    @Payload()
    data: {
      courseId: string;
      dto: PublishCourseDto;
      ownerId?: string;
      user?: { id?: string; sub?: string };
    },
  ) {
    const { courseId, dto, ownerId, user } = data;
    if (!courseId || !dto) throw new Error('courseId and dto are required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.courseService.publishCourse(courseId, dto, userId);
  }

  @MessagePattern({ cmd: 'app.courses.delete' })
  deleteCourse(@Payload() data: { courseId: string; ownerId?: string; user?: { id?: string; sub?: string } }) {
    const { courseId, ownerId, user } = data;
    if (!courseId) throw new Error('courseId is required');
    
    // Extract ownerId from multiple possible sources
    const userId = ownerId || user?.id || user?.sub;
    if (!userId) throw new Error('User identification is required');

    return this.courseService.deleteCourse(courseId, userId);
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
