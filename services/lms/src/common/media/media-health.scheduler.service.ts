import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { S3Service } from '../utils/storage/s3.service';
import { normalizeLmsS3ObjectKey, objectKeyFromStoredValue } from '../utils/s3-key.util';

/**
 * Lightweight sampling: HEAD a few recent lesson / library keys.
 * Set MEDIA_HEALTH_CRON_DISABLED=1 to turn off. Tune with MEDIA_HEALTH_SAMPLE_SIZE (default 6).
 */
@Injectable()
export class MediaHealthSchedulerService {
  private readonly logger = new Logger(MediaHealthSchedulerService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly s3: S3Service,
  ) {}

  @Cron('37 */3 * * *')
  async runHeadSamples(): Promise<void> {
    if (process.env.MEDIA_HEALTH_CRON_DISABLED === '1') {
      return;
    }
    const n = Math.min(
      20,
      Math.max(
        2,
        Number.parseInt(process.env.MEDIA_HEALTH_SAMPLE_SIZE || '6', 10) || 6,
      ),
    );
    const db = this.connection.db;
    if (!db) {
      this.logger.warn('[MEDIA_HEALTH] no db handle');
      return;
    }

    const results: Array<{
      kind: 'lesson_video' | 'library_asset';
      id: string;
      ok: boolean;
      keySample: string;
    }> = [];

    try {
      const half = Math.ceil(n / 2);
      const lessonCur = db
        .collection('lessons')
        .find(
          { videoObjectKey: { $exists: true, $nin: [null, ''] } },
          {
            projection: { videoObjectKey: 1 },
            sort: { _id: -1 },
            limit: half,
          },
        );
      for await (const row of lessonCur) {
        const id = String(row._id);
        const raw = row.videoObjectKey as string | undefined;
        const key = normalizeLmsS3ObjectKey(
          objectKeyFromStoredValue(String(raw ?? '').trim()),
        );
        if (!key) continue;
        try {
          const ok = await this.s3.headObjectExists(key);
          results.push({ kind: 'lesson_video', id, ok, keySample: key.slice(0, 120) });
        } catch {
          results.push({ kind: 'lesson_video', id, ok: false, keySample: key.slice(0, 120) });
        }
      }

      const libColl = 'libraryassets';
      const names = new Set((await db.listCollections().toArray()).map((c) => c.name));
      if (names.has(libColl)) {
        const assetCur = db.collection(libColl).find(
          { objectKey: { $exists: true, $nin: [null, ''] } },
          {
            projection: { objectKey: 1 },
            sort: { _id: -1 },
            limit: n - half,
          },
        );
        for await (const row of assetCur) {
          const id = String(row._id);
          const raw = row.objectKey as string | undefined;
          const key = normalizeLmsS3ObjectKey(
            objectKeyFromStoredValue(String(raw ?? '').trim()),
          );
          if (!key) continue;
          try {
            const ok = await this.s3.headObjectExistsInLibrary(key);
            results.push({ kind: 'library_asset', id, ok, keySample: key.slice(0, 120) });
          } catch {
            results.push({ kind: 'library_asset', id, ok: false, keySample: key.slice(0, 120) });
          }
        }
      }
    } catch (e) {
      this.logger.warn(
        `[MEDIA_HEALTH] probe_error ${e instanceof Error ? e.message : String(e)}`,
      );
      return;
    }

    const failed = results.filter((r) => !r.ok);
    // eslint-disable-next-line no-console
    console.log(
      '[MEDIA_HEALTH]',
      JSON.stringify({
        phase: 'sample_head',
        sampled: results.length,
        failures: failed.length,
        items: results,
      }),
    );
  }
}
