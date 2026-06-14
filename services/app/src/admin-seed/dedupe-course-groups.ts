import 'dotenv/config';
/**
 * Merge duplicate course-linked community groups (same courseId).
 *
 * Run from `services/app`:
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/dedupe-course-groups.ts
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/dedupe-course-groups.ts --dry-run
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SocialHubService } from '../Community/social/social-hub.service';

async function main() {
  const dry = process.argv.includes('--dry-run');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const social = app.get(SocialHubService);
  try {
    const r = await social.repairDuplicateCourseLinkedGroups({ dryRun: dry });
    // eslint-disable-next-line no-console
    console.log(
      `[DUPLICATE_GROUP_REPAIR] done dryRun=${dry} duplicateCourseIds=${r.duplicateCourseIds} groupsRemoved=${r.groupsRemoved}`,
    );
  } finally {
    await app.close();
  }
}

main().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
