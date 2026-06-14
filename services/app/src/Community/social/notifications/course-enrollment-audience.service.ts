import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

const log = new Logger('CourseEnrollmentAudience');

export type EnrolledStudentPage = {
  userIds: string[];
  nextCursor: string | null;
  total?: number;
};

@Injectable()
export class CourseEnrollmentAudienceService {
  private readonly cache = new Map<
    string,
    { userIds: string[]; expiresAt: number }
  >();
  private static readonly CACHE_TTL_MS = 60_000;

  constructor(
    @Inject('NATS_OUTBOUND') private readonly natsClient: ClientProxy,
  ) {}

  async listEnrolledStudentIds(
    courseId: string,
    opts?: { cursor?: string; limit?: number; useCache?: boolean },
  ): Promise<EnrolledStudentPage> {
    const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500);
    const cacheKey = `${courseId}:${opts?.cursor ?? 'start'}`;

    if (opts?.useCache !== false && !opts?.cursor) {
      const hit = this.cache.get(courseId);
      if (hit && hit.expiresAt > Date.now()) {
        const start = opts?.cursor
          ? parseInt(String(opts.cursor), 10) || 0
          : 0;
        const slice = hit.userIds.slice(start, start + limit);
        const next =
          start + limit < hit.userIds.length
            ? String(start + limit)
            : null;
        return { userIds: slice, nextCursor: next, total: hit.userIds.length };
      }
    }

    try {
      const raw = await firstValueFrom(
        this.natsClient
          .send(
            { cmd: 'app.courses.enrollment.listStudentsByCourse' },
            { courseId, cursor: opts?.cursor, limit },
          )
          .pipe(timeout(12_000)),
      );
      const data =
        (raw as { data?: EnrolledStudentPage })?.data ??
        (raw as EnrolledStudentPage);
      const userIds = (data?.userIds ?? []).map(String).filter(Boolean);
      const page: EnrolledStudentPage = {
        userIds,
        nextCursor: data?.nextCursor ?? null,
        total: data?.total,
      };

      if (!opts?.cursor && userIds.length > 0 && opts?.useCache !== false) {
        this.cache.set(courseId, {
          userIds,
          expiresAt: Date.now() + CourseEnrollmentAudienceService.CACHE_TTL_MS,
        });
      }
      return page;
    } catch (err) {
      log.warn(
        `[NOTIFICATION_FAILED] listEnrolledStudentIds courseId=${courseId}: ${(err as Error).message}`,
      );
      return { userIds: [], nextCursor: null };
    }
  }

  /** Iterate all enrolled students in chunks (queue-ready iterator). */
  async *iterateEnrolledStudentIds(
    courseId: string,
    chunkSize = 100,
  ): AsyncGenerator<string[]> {
    let cursor: string | undefined;
    for (;;) {
      const page = await this.listEnrolledStudentIds(courseId, {
        cursor,
        limit: chunkSize,
        useCache: false,
      });
      if (!page.userIds.length) break;
      yield page.userIds;
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
  }

  invalidateCourseCache(courseId: string) {
    this.cache.delete(courseId);
  }
}
