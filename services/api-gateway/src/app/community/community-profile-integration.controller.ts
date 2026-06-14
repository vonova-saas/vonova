import {
  Controller,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CommunitySocialGatewayService } from './social.gateway.service';
import { EnrollGatewayService } from '../../lms/course/enroll/enroll.gateway.service';
import { CourseGatewayService } from '../../lms/course/course/course.gateway.service';
import { S3Service } from '../../common/utils/storage/s3.service';
import { presignCourseThumbnailFields } from '../../lms/course/course/course-thumbnail-presign.helper';

function unwrapData<T>(r: unknown): T {
  if (r && typeof r === 'object' && 'data' in (r as object)) {
    return (r as { data: T }).data;
  }
  return r as T;
}

@ApiTags('Community Profile LMS')
@ApiBearerAuth()
@Controller('api/v1/community/profile-integration')
@UseGuards(JwtAuthGuard)
export class CommunityProfileIntegrationController {
  private readonly log = new Logger(CommunityProfileIntegrationController.name);

  constructor(
    private readonly social: CommunitySocialGatewayService,
    private readonly enroll: EnrollGatewayService,
    private readonly course: CourseGatewayService,
    private readonly s3: S3Service,
  ) {}

  @Get(':username')
  @ApiOperation({
    summary:
      'Bundle: community groups + LMS enrollments + courses you teach (authenticated user must match profile)',
  })
  async getBundle(@Param('username') username: string, @Request() req: any) {
    const requesterId = String(
      req.user?._id ?? req.user?.id ?? req.user?.sub ?? '',
    );
    if (!requesterId) throw new ForbiddenException();

    const rawProfile = await firstValueFrom(
      this.social.profileByUsername(username.trim()),
    );
    const profile = unwrapData<Record<string, unknown>>(rawProfile);
    const profileUserId = profile?._id != null ? String(profile._id) : '';
    if (!profileUserId) {
      throw new NotFoundException('Profile not found');
    }
    if (profileUserId !== requesterId) {
      throw new ForbiddenException(
        'Profile LMS bundle is only available for your own profile',
      );
    }

    const groupsPayload = await firstValueFrom(
      this.social.listGroups(1, 80, requesterId),
    );
    const groupsPaged = unwrapData<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
    }>(groupsPayload);

    let enrolledCourses: unknown[] = [];
    try {
      const rows = (await firstValueFrom(
        this.enroll.listStudentEnrollments(requesterId),
      )) as Array<{
        _id: unknown;
        courseId: unknown;
        status: string;
        progressPercentage?: number;
      }>;
      enrolledCourses = (
        await Promise.all(
          rows.map(async (row) => {
            try {
              const raw = await firstValueFrom(
                this.course.getCourseById(String(row.courseId), requesterId),
              );
              const course = await presignCourseThumbnailFields(
                raw as Record<string, unknown>,
                this.s3,
              );
              return {
                course,
                progress: row.progressPercentage ?? 0,
                status: row.status,
                enrollmentId: String(row._id),
              };
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean);
    } catch (e) {
      this.log.warn(
        `profile-integration enrollments: ${(e as Error).message}`,
      );
    }

    let teachingCourses: { items: unknown[] } = { items: [] };
    try {
      const rawMy = await firstValueFrom(this.course.getMyCourses(requesterId));
      const inner = unwrapData<{ items?: unknown[] }>(rawMy);
      if (inner?.items && Array.isArray(inner.items)) {
        teachingCourses = {
          items: await Promise.all(
            inner.items.map((c: Record<string, unknown>) =>
              presignCourseThumbnailFields(c, this.s3),
            ),
          ),
        };
      }
    } catch (e) {
      this.log.warn(`profile-integration teaching: ${(e as Error).message}`);
    }

    return {
      success: true,
      data: {
        profileUserId,
        role: req.user?.role ?? null,
        groups: groupsPaged?.items ?? [],
        groupsTotal: groupsPaged?.total ?? 0,
        enrolledCourses,
        teachingCourses,
      },
    };
  }
}
