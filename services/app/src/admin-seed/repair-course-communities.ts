import 'dotenv/config';
/**
 * Backfill course-linked community groups and enrollment membership.
 *
 * Requires:
 *   - Same .env as `services/app` (App Mongo + models)
 *   - LMS Mongo URI: set `REPAIR_LMS_MONGO_URI`, or `MONGO_URI_REMOTE_LMS` / `MONGO_URI_LOCAL_LMS`
 *
 * Run from `services/app`:
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/repair-course-communities.ts
 */
import mongoose from 'mongoose';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SocialHubService } from '../Community/social/social-hub.service';

async function main() {
  const lmsUri =
    process.env.REPAIR_LMS_MONGO_URI?.trim() ||
    process.env.MONGO_URI_REMOTE_LMS?.trim() ||
    process.env.MONGO_URI_LOCAL_LMS?.trim();
  if (!lmsUri) {
    throw new Error(
      'Set REPAIR_LMS_MONGO_URI or MONGO_URI_REMOTE_LMS / MONGO_URI_LOCAL_LMS',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const social = app.get(SocialHubService);
  const lms = await mongoose.createConnection(lmsUri).asPromise();
  const db = lms.db;
  if (!db) {
    throw new Error('LMS connection has no database handle');
  }

  try {
    const col = db.collection('courses');
    const cursor = col.find(
      {},
      { projection: { title: 1, description: 1, ownerId: 1 } },
    );
    let courses = 0;
    let joins = 0;
    for await (const c of cursor) {
      const courseId = String(c._id);
      const instructorId = String(c.ownerId);
      const title = String((c as { title?: string }).title ?? 'Course');
      const description = String(
        (c as { description?: string }).description ?? '',
      );
      const group = await social.ensureCourseGroup({
        courseId,
        instructorId,
        name: title,
        description,
        triggerSource: 'script.repair-course-communities',
      });
      const gid = String((group as { _id?: unknown })._id ?? '');
      if (gid && mongoose.isValidObjectId(gid)) {
        await col.updateOne(
          { _id: c._id },
          { $set: { communityGroupId: new mongoose.Types.ObjectId(gid) } },
        );
      }
      courses += 1;

      const enr = db.collection('enrollments').find({
        courseId: c._id,
        status: { $in: ['ACTIVE', 'COMPLETED'] },
      });
      for await (const e of enr) {
        const uid = String((e as { userId?: unknown }).userId ?? '');
        if (!uid || !mongoose.isValidObjectId(uid)) continue;
        await social.joinCourseGroup(courseId, uid);
        joins += 1;
      }
    }
    // eslint-disable-next-line no-console
    console.log(
      `[repair-course-communities] processed ${courses} courses, ${joins} join attempts`,
    );
  } finally {
    await lms.close();
    await app.close();
  }
}

main().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
