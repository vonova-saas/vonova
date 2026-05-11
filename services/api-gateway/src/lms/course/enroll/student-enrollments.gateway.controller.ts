import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { EnrollGatewayService } from './enroll.gateway.service';
import { CourseGatewayService } from '../course/course.gateway.service';
import { S3Service } from 'src/common/utils/storage/s3.service';
import { presignCourseThumbnailFields } from '../course/course-thumbnail-presign.helper';

@ApiTags('LMS Student Enrollments')
@ApiBearerAuth()
@Controller('api/v1/lms/student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT_USER)
export class StudentEnrollmentsGatewayController {
  constructor(
    private readonly enrollService: EnrollGatewayService,
    private readonly courseService: CourseGatewayService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiOperation({ summary: 'List my course enrollments with course summary' })
  @ApiResponse({ status: 200, description: 'Enrollments with courses' })
  @Get('enrollments')
  async listMyEnrollments(@Request() req: any) {
    const userId = req.user?._id ?? req.user?.id ?? req.user?.sub;
    const rows = (await firstValueFrom(
      this.enrollService.listStudentEnrollments(userId),
    )) as Array<{
      _id: unknown;
      courseId: unknown;
      status: string;
      progressPercentage?: number;
    }>;

    const data = await Promise.all(
      rows.map(async (row) => {
        let course: unknown = null;
        try {
          const raw = await firstValueFrom(
            this.courseService.getCourseById(String(row.courseId), userId),
          );
          course = await presignCourseThumbnailFields(
            raw as Record<string, unknown>,
            this.s3Service,
          );
        } catch {
          course = null;
        }
        return {
          course,
          progress: row.progressPercentage ?? 0,
          status: row.status,
          enrollmentId: String(row._id),
        };
      }),
    );

    return {
      success: true,
      message: 'Enrollments loaded',
      data,
    };
  }
}
