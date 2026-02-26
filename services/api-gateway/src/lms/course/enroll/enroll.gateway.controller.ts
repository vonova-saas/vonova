/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { EnrollGatewayService } from './enroll.gateway.service';
import { EnrollCourseDto } from './dto/enroll.dto';

@Controller('api/v1/lms/courses')
@UseGuards(JwtAuthGuard)
export class EnrollGatewayController {
  constructor(private readonly enrollService: EnrollGatewayService) {}

  @Post(':courseId/enroll')
  async enrollCourse(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollCourseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.enrollCourse(courseId, userId, dto));
  }

  @Get(':courseId/enrollment')
  async getEnrollment(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.getEnrollment(courseId, userId));
  }

  @Get(':courseId/lessons/:lessonId/access')
  async getLessonAccess(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return firstValueFrom(this.enrollService.getLessonAccess(courseId, lessonId, userId));
  }
}
