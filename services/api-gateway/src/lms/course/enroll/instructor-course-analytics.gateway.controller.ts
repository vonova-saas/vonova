import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { EnrollGatewayService } from './enroll.gateway.service';

@ApiTags('LMS Instructor Course Analytics')
@ApiBearerAuth()
@Controller('api/v1/lms/instructor/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR_USER)
export class InstructorCourseAnalyticsGatewayController {
  constructor(private readonly enrollService: EnrollGatewayService) {}

  @ApiOperation({ summary: 'Per-student progress and quiz stats for a course' })
  @ApiParam({ name: 'courseId', description: 'Course id' })
  @Get(':courseId/analytics')
  async getAnalytics(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const instructorId =
      req.user?._id ?? req.user?.id ?? req.user?.sub;
    const payload = await firstValueFrom(
      this.enrollService.getInstructorCourseAnalytics(courseId, instructorId),
    );
    return {
      success: true,
      message: 'Analytics loaded',
      data: payload,
    };
  }

  @Get(':courseId/students')
  async getStudents(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const instructorId =
      req.user?._id ?? req.user?.id ?? req.user?.sub;
    const payload = await firstValueFrom(
      this.enrollService.getInstructorCourseAnalytics(courseId, instructorId),
    ) as { students?: unknown[] };
    return {
      success: true,
      message: 'Students loaded',
      data: { students: payload.students ?? [] },
    };
  }

  @Get(':courseId/progress')
  async getProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const instructorId =
      req.user?._id ?? req.user?.id ?? req.user?.sub;
    const payload = await firstValueFrom(
      this.enrollService.getInstructorCourseAnalytics(courseId, instructorId),
    ) as { progress?: unknown };
    return {
      success: true,
      message: 'Progress summary loaded',
      data: { progress: payload.progress ?? {} },
    };
  }
}
