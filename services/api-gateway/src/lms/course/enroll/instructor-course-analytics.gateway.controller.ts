import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { EnrollGatewayService } from './enroll.gateway.service';
import { CommunitySocialGatewayService } from 'src/app/community/social.gateway.service';

function instructorIdFromReq(req: { user?: Record<string, unknown> }) {
  const u = req.user;
  return String(u?._id ?? u?.id ?? u?.sub ?? '');
}

@ApiTags('LMS Instructor Course Analytics')
@ApiBearerAuth()
@Controller('api/v1/lms/instructor/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR_USER)
export class InstructorCourseAnalyticsGatewayController {
  constructor(
    private readonly enrollService: EnrollGatewayService,
    private readonly social: CommunitySocialGatewayService,
  ) {}

  @ApiOperation({ summary: 'Legacy combined analytics payload' })
  @ApiParam({ name: 'courseId', description: 'Course id' })
  @Get(':courseId/analytics')
  async getAnalyticsLegacy(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const payload = await firstValueFrom(
      this.enrollService.getInstructorCourseAnalytics(courseId, instructorId),
    );
    return { success: true, message: 'Analytics loaded', data: payload };
  }

  @Get(':courseId/analytics/overview')
  async getOverview(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const data = await firstValueFrom(
      this.enrollService.getCourseAnalyticsOverview(courseId, instructorId),
    );
    return { success: true, message: 'Overview loaded', data };
  }

  @Get(':courseId/analytics/students')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'filter', required: false })
  async getStudents(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'progress' | 'quiz' | 'lastActive' | 'joined',
    @Query('filter') filter?: 'inactive' | 'completed' | 'lowPerformers',
  ) {
    const instructorId = instructorIdFromReq(req);
    const data = await firstValueFrom(
      this.enrollService.getCourseAnalyticsStudents(courseId, instructorId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search,
        sort,
        filter,
      }),
    );
    return { success: true, message: 'Students loaded', data };
  }

  @Get(':courseId/analytics/quizzes')
  async getQuizzes(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const data = await firstValueFrom(
      this.enrollService.getCourseAnalyticsQuizzes(courseId, instructorId),
    );
    return { success: true, message: 'Quiz analytics loaded', data };
  }

  @Get(':courseId/analytics/engagement')
  async getEngagement(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const data = await firstValueFrom(
      this.enrollService.getCourseAnalyticsEngagement(courseId, instructorId),
    );
    return { success: true, message: 'Engagement loaded', data };
  }

  @Get(':courseId/analytics/community')
  async getCommunity(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const res = await firstValueFrom(
      this.social.courseCommunityAnalytics(courseId, instructorId),
    );
    const data =
      res && typeof res === 'object' && 'data' in res
        ? (res as { data: unknown }).data
        : res;
    return { success: true, message: 'Community analytics loaded', data };
  }

  @Get(':courseId/analytics/export')
  @ApiQuery({ name: 'format', required: false, enum: ['csv'] })
  async exportStudents(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
    @Query('format') _format?: string,
  ) {
    const instructorId = instructorIdFromReq(req);
    const csv = await firstValueFrom(
      this.enrollService.exportCourseAnalyticsStudents(courseId, instructorId),
    );
    const body = typeof csv === 'string' ? csv : String(csv ?? '');
    return new StreamableFile(Buffer.from(body, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="course-${courseId}-students.csv"`,
    });
  }

  @Get(':courseId/students')
  async getStudentsLegacy(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return this.getStudents(courseId, req, '1', '100', undefined, 'progress', undefined);
  }

  @Get(':courseId/progress')
  async getProgressLegacy(
    @Param('courseId') courseId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const instructorId = instructorIdFromReq(req);
    const overview = await firstValueFrom(
      this.enrollService.getCourseAnalyticsOverview(courseId, instructorId),
    );
    return {
      success: true,
      message: 'Progress summary loaded',
      data: {
        averageProgress: overview.averageProgress,
        lessonCompletionRate: overview.lessonCompletionRate,
        totalLessonsCompleted: overview.totalLessonsCompleted,
        totalLessons: overview.totalLessons,
      },
    };
  }
}
