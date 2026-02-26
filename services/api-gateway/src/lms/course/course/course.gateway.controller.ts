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
  Query,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CourseGatewayService } from './course.gateway.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
} from './dto/course.dto';

@Controller('api/v1/lms/courses')
@UseGuards(JwtAuthGuard)
export class CourseGatewayController {
  constructor(private readonly courseService: CourseGatewayService) {}

  @Post('createCourse')
  async createCourse(
    @Body() dto: CreateCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.createCourse(dto, ownerId));
  }

  @Patch(':courseId')
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.updateCourse(courseId, dto, ownerId));
  }

  @Patch(':courseId/publish')
  async publishCourse(
    @Param('courseId') courseId: string,
    @Body() dto: PublishCourseDto,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.publishCourse(courseId, dto, ownerId));
  }

  @Delete(':courseId')
  async deleteCourse(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const ownerId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.courseService.deleteCourse(courseId, ownerId));
  }

  @Post(':courseId/recompute-aggregates')
  async recomputeAggregates(
    @Param('courseId') courseId: string,
    @Request() _req: any,
  ) {
    return firstValueFrom(this.courseService.recomputeAggregates(courseId));
  }

  @Get()
  async getAllCourses(@Query() filters?: any) {
    return firstValueFrom(this.courseService.getAllCourses(filters));
  }

  @Get('slug/:slug')
  async getCourseBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.courseService.getCourseBySlug(slug));
  }

  @Get(':courseId')
  async getCourseById(@Param('courseId') courseId: string) {
    return firstValueFrom(this.courseService.getCourseById(courseId));
  }
}
