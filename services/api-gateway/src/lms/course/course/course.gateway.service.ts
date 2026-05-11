import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';

@Injectable()
export class CourseGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) { }

  createCourse(dto: CreateCourseDto, createdBy: string) {
    return this.client.send(
      { cmd: 'app.courses.create' },
      {
        dto,
        createdBy,
        user: { id: createdBy },
      },
    );
  }

  updateCourse(courseId: string, dto: UpdateCourseDto, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.update' },
      { courseId, dto, ownerId, user: { id: ownerId } },
    );
  }

  publishCourse(courseId: string, dto: PublishCourseDto, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.publish' },
      { courseId, dto, ownerId, user: { id: ownerId } },
    );
  }

  deleteCourse(courseId: string, ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.delete' },
      { courseId, ownerId, user: { id: ownerId } },
    );
  }

  recomputeAggregates(courseId: string) {
    return this.client.send(
      { cmd: 'app.courses.recomputeAggregates' },
      { courseId },
    );
  }

  getAllCourses(filters?: Record<string, unknown>) {
    return this.client.send({ cmd: 'app.courses.getAll' }, filters || {});
  }

  getCourseBySlug(slug: string, requesterId?: string) {
    return this.client.send(
      { cmd: 'app.courses.getBySlug' },
      {
        slug,
        requesterId,
        userId: requesterId,
        user: requesterId ? { id: requesterId, _id: requesterId } : undefined,
      },
    );
  }

  getCourseById(courseId: string, requesterId?: string) {
    return this.client.send(
      { cmd: 'app.courses.getById' },
      {
        courseId,
        requesterId,
        userId: requesterId,
        user: requesterId ? { id: requesterId, _id: requesterId } : undefined,
      },
    );
  }

  getCourseDetails(courseId: string) {
    return this.client.send({ cmd: 'app.courses.getDetails' }, { courseId });
  }

  getMyCourses(ownerId: string) {
    return this.client.send(
      { cmd: 'app.courses.getMyCourses' },
      { ownerId, user: { id: ownerId } },
    );
  }
}
