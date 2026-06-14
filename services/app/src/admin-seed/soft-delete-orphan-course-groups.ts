import 'dotenv/config';
/**
 * Soft-delete community course groups whose LMS `courses` row no longer exists.
 *
 * Requires:
 *   - Same .env as `services/app` (App Mongo)
 *   - LMS Mongo URI: `REPAIR_LMS_MONGO_URI`, or `MONGO_URI_REMOTE_LMS` / `MONGO_URI_LOCAL_LMS`
 *
 * Run from `services/app`:
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/soft-delete-orphan-course-groups.ts
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/soft-delete-orphan-course-groups.ts --dry-run
 */
import mongoose from 'mongoose';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SocialHubService } from '../Community/social/social-hub.service';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
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

  try {
    const r = await social.repairSoftDeleteOrphanCourseGroupsByLms(lms, {
      dryRun,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[soft-delete-orphan-course-groups] dryRun=${dryRun} ${JSON.stringify(r)}`,
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
