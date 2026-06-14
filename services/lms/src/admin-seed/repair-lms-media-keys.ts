/**
 * Offline repair: normalize malformed LMS S3 keys in Mongo and verify objects
 * exist in AWS_S3_BUCKET_LMS (vonova-lms) via HEAD before persisting changes.
 *
 * Does NOT touch Community, NATS, or enrollment data.
 *
 * Environment (same as LMS service):
 *   REPAIR_LMS_MONGO_URI | MONGO_URI_REMOTE_LMS | MONGO_URI_LOCAL_LMS
 *   MONGO_DB_NAME_LMS (optional if URI includes database name)
 *   AWS_S3_BUCKET_LMS, AWS_S3_REGION_LMS
 *   AWS_S3_ACCESS_KEY_ID_LMS, AWS_S3_SECRET_ACCESS_KEY_LMS
 *   REPAIR_DRY_RUN=1 — log only, no Mongo writes
 *   REPAIR_VIDEO_LIST_S3=1 — after candidate HEADs fail, ListObjectsV2 under
 *     course/{courseId}/content/lesson/{lessonId}/ (limited) to find video keys
 *   REPAIR_LESSON_ID=<24hex> — only repair that lesson's video + thumbnailKey
 *   REPAIR_ASSET_ID=<24hex> — only repair that library asset objectKey
 *
 * Loads `services/lms/.env` when present (run with cwd = `services/lms`).
 *
 * Run from `services/lms`:
 *   npx ts-node -r tsconfig-paths/register src/admin-seed/repair-lms-media-keys.ts
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';
import type { Db } from 'mongodb';
import {
  S3Client,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  normalizeLmsS3ObjectKey,
  lmsS3KeyRecoveryCandidates,
  objectKeyFromStoredValue,
} from '../common/utils/s3-key.util';
import { bumpMediaMetric } from '../common/media/media-metrics';

function loadEnvFromDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq <= 0) continue;
    const k = s.slice(0, eq).trim();
    let v = s.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined || process.env[k] === '') {
      process.env[k] = v;
    }
  }
}

function logRepair(payload: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.log('[MIGRATION_REPAIR]', JSON.stringify(payload));
}

function resolveMongoUri(): string {
  const uri =
    process.env.REPAIR_LMS_MONGO_URI?.trim() ||
    process.env.MONGO_URI_REMOTE_LMS?.trim() ||
    process.env.MONGO_URI_LOCAL_LMS?.trim();
  if (!uri) {
    throw new Error(
      'Set REPAIR_LMS_MONGO_URI or MONGO_URI_REMOTE_LMS / MONGO_URI_LOCAL_LMS',
    );
  }
  return uri;
}

function resolveBucketRegion(): { bucket: string; region: string } {
  const bucket = process.env.AWS_S3_BUCKET_LMS?.trim();
  const region =
    process.env.AWS_S3_REGION_LMS?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim();
  if (!bucket || !region) {
    throw new Error(
      'Set AWS_S3_BUCKET_LMS and AWS_S3_REGION_LMS for S3 HEAD verification',
    );
  }
  return { bucket, region };
}

function looksLikeWrongAppBucketHint(raw: string, expectedBucket: string): boolean {
  const lower = raw.toLowerCase();
  if (!lower.includes('amazonaws.com')) return false;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    const b = expectedBucket.toLowerCase();
    return !host.startsWith(`${b}.`) && host.includes('s3');
  } catch {
    return false;
  }
}

function looksLikePresignedUrl(raw: string): boolean {
  return (
    raw.includes('X-Amz-Algorithm=') ||
    raw.includes('X-Amz-Signature=') ||
    /[?&]X-Amz-/.test(raw)
  );
}

async function headExists(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Ordered unique keys to try (normalized + recovery + raw). */
function headCandidatesFor(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (k: string) => {
    const t = k.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  for (const c of lmsS3KeyRecoveryCandidates(raw)) {
    push(normalizeLmsS3ObjectKey(c));
  }
  push(normalizeLmsS3ObjectKey(raw));
  push(raw);
  return out;
}

const LESSON_VIDEO_FIELDS = [
  'videoObjectKey',
  'videoKey',
  'videoUrl',
  'streamKey',
  'videoS3Key',
] as const;

function basenameKey(path: string): string {
  const p = path.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  const i = p.lastIndexOf('/');
  return i >= 0 ? p.slice(i + 1) : p;
}

/** Collapse videos/videos/… (not handled by normalizeLmsS3ObjectKey). */
function stripVideosDupes(k: string): string {
  let x = k;
  while (x.startsWith('videos/videos/')) {
    x = x.slice('videos/'.length);
  }
  return x;
}

function normalizeVideoKeyCandidate(raw: string): string {
  return stripVideosDupes(
    normalizeLmsS3ObjectKey(objectKeyFromStoredValue(raw.trim())),
  );
}

function logVideoRecovery(
  kind: 'ATTEMPT' | 'SUCCESS' | 'FAILED',
  payload: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.log(`[VIDEO_RECOVERY_${kind}]`, JSON.stringify(payload));
}

/**
 * Ordered unique S3 keys to HEAD for legacy lesson video repair.
 */
function orderedLessonVideoCandidates(
  sources: string[],
  lessonHex: string,
  courseHex: string | undefined,
): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const n = normalizeVideoKeyCandidate(raw);
    if (!n || seen.has(n)) return;
    seen.add(n);
    ordered.push(n);
  };

  for (const s of sources) {
    add(s);
    for (const c of lmsS3KeyRecoveryCandidates(s)) {
      add(c);
    }
    try {
      const dec = decodeURIComponent(normalizeLmsS3ObjectKey(objectKeyFromStoredValue(s)));
      if (dec !== s) add(dec);
    } catch {
      /* ignore bad % sequences */
    }
  }

  const basenames = new Set<string>();
  for (const s of sources) {
    const b = basenameKey(normalizeVideoKeyCandidate(s));
    if (b) basenames.add(b);
  }

  const oid24 = /^[a-f0-9]{24}$/i;
  if (courseHex && oid24.test(courseHex) && oid24.test(lessonHex)) {
    for (const b of basenames) {
      add(`course/${courseHex}/content/lesson/${lessonHex}/${b}`);
    }
  }

  const pass1 = [...ordered];
  for (const k of pass1) {
    if (!k.startsWith('courses/')) {
      add(`courses/${k}`);
    }
    if (!k.startsWith('course/')) {
      add(`course/${k}`);
    }
    const b = basenameKey(k);
    if (b) {
      add(`videos/${b}`);
      add(`courses/videos/${b}`);
    }
  }

  const pass2 = [...ordered];
  for (const k of pass2) {
    try {
      const dec = decodeURIComponent(k);
      if (dec !== k) add(dec);
    } catch {
      /* ignore */
    }
  }

  return ordered;
}

async function listLessonFolderVideoKeys(
  s3: S3Client,
  bucket: string,
  courseHex: string,
  lessonHex: string,
  maxKeys: number,
): Promise<string[]> {
  const prefix = `course/${courseHex}/content/lesson/${lessonHex}/`;
  const out: string[] = [];
  const resp = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );
  for (const o of resp.Contents ?? []) {
    const key = o.Key?.trim();
    if (!key) continue;
    if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(key)) {
      out.push(normalizeVideoKeyCandidate(key));
    }
  }
  return [...new Set(out)];
}

async function main(): Promise<void> {
  loadEnvFromDotEnv();
  const dryRun = process.env.REPAIR_DRY_RUN === '1';
  const uri = resolveMongoUri();
  const { bucket, region } = resolveBucketRegion();
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID_LMS?.trim();
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY_LMS?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'Set AWS_S3_ACCESS_KEY_ID_LMS and AWS_S3_SECRET_ACCESS_KEY_LMS',
    );
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  const dbName = process.env.MONGO_DB_NAME_LMS?.trim();
  const conn = mongoose.createConnection(uri, dbName ? { dbName } : {});
  await conn.asPromise();
  const dbHandle = conn.db;
  if (!dbHandle) {
    throw new Error('Mongo connection has no database handle');
  }
  const mongoDb: Db = dbHandle;

  let updated = 0;
  let scanned = 0;
  let headHits = 0;
  let headMisses = 0;

  const collections = await mongoDb.listCollections().toArray();
  const names = new Set(collections.map((c) => c.name));
  const libraryColl = 'libraryassets';

  const onlyLessonId = process.env.REPAIR_LESSON_ID?.trim();
  const onlyAssetId = process.env.REPAIR_ASSET_ID?.trim();
  const singleLessonOid =
    onlyLessonId && mongoose.Types.ObjectId.isValid(onlyLessonId)
      ? new mongoose.Types.ObjectId(onlyLessonId)
      : null;
  const singleAssetOid =
    onlyAssetId && mongoose.Types.ObjectId.isValid(onlyAssetId)
      ? new mongoose.Types.ObjectId(onlyAssetId)
      : null;
  if (singleLessonOid && singleAssetOid) {
    throw new Error('Set only one of REPAIR_LESSON_ID or REPAIR_ASSET_ID per run');
  }

  async function repairStringField(
    collName: string,
    id: unknown,
    field: string,
    before: string | undefined | null,
  ): Promise<void> {
    if (before == null) return;
    const raw = String(before).trim();
    if (!raw) return;
    if (looksLikePresignedUrl(raw)) return;

    scanned += 1;

    if (looksLikeWrongAppBucketHint(raw, bucket)) {
      logRepair({
        phase: 'hint',
        collection: collName,
        id: String(id),
        field,
        reason: 'url_host_may_not_match_lms_bucket',
        sample: raw.slice(0, 120),
        expectedBucket: bucket,
      });
    }

    const candidates = headCandidatesFor(raw);
    let winner: string | null = null;
    for (const k of candidates) {
      if (await headExists(s3, bucket, k)) {
        winner = k;
        break;
      }
    }

    if (!winner) {
      headMisses += 1;
      logRepair({
        phase: 'head_miss_all_candidates',
        collection: collName,
        id: String(id),
        field,
        rawSample: raw.slice(0, 200),
        candidatesTried: candidates,
        dryRun,
      });
      return;
    }

    if (winner === raw) return;

    headHits += 1;
    logRepair({
      phase: 'repair',
      collection: collName,
      id: String(id),
      field,
      from: raw.slice(0, 240),
      to: winner,
      dryRun,
    });
    if (!dryRun) {
      await mongoDb
        .collection(collName)
        .updateOne({ _id: id as never }, { $set: { [field]: winner } });
      updated += 1;
    }
  }

  let lessonVideoFailures = 0;

  async function repairLessonVideos(
    doc: Record<string, unknown> & { _id?: unknown },
  ): Promise<void> {
    const id = doc._id;
    if (id == null) return;
    const lessonHex = String(id);
    const courseRaw = doc.courseId;
    const courseHex =
      courseRaw != null &&
      typeof courseRaw === 'object' &&
      'toString' in courseRaw
        ? String(courseRaw)
        : courseRaw != null
          ? String(courseRaw)
          : undefined;

    const sources: string[] = [];
    for (const f of LESSON_VIDEO_FIELDS) {
      const v = doc[f];
      if (typeof v !== 'string') continue;
      const t = v.trim();
      if (!t) continue;
      if (looksLikePresignedUrl(t)) continue;
      sources.push(t);
    }
    if (sources.length === 0) return;

    for (const t of sources) {
      scanned += 1;
      if (looksLikeWrongAppBucketHint(t, bucket)) {
        logRepair({
          phase: 'hint',
          collection: 'lessons',
          id: lessonHex,
          field: 'video',
          reason: 'url_host_may_not_match_lms_bucket',
          sample: t.slice(0, 120),
          expectedBucket: bucket,
        });
      }
    }

    const primaryRaw =
      typeof doc.videoObjectKey === 'string' ? doc.videoObjectKey.trim() : '';
    const primaryNorm = primaryRaw
      ? normalizeVideoKeyCandidate(primaryRaw)
      : '';

    if (primaryNorm && (await headExists(s3, bucket, primaryNorm))) {
      return;
    }

    logVideoRecovery('ATTEMPT', {
      lessonId: lessonHex,
      oldKey: (primaryNorm || sources[0] || '').slice(0, 240),
      bucket,
      region,
    });

    const candSet = new Set<string>();
    const addNorm = (k: string) => {
      const n = normalizeVideoKeyCandidate(k);
      if (n) candSet.add(n);
    };

    for (const k of orderedLessonVideoCandidates(sources, lessonHex, courseHex)) {
      addNorm(k);
    }
    for (const s of sources) {
      for (const c of headCandidatesFor(s)) {
        addNorm(c);
      }
    }

    const candidates = [...candSet];
    let winner: string | null = null;
    for (const k of candidates) {
      if (await headExists(s3, bucket, k)) {
        winner = k;
        break;
      }
    }

    const listEnabled = process.env.REPAIR_VIDEO_LIST_S3 === '1';
    const oid24 = /^[a-f0-9]{24}$/i;
    if (
      !winner &&
      listEnabled &&
      courseHex &&
      oid24.test(courseHex) &&
      oid24.test(lessonHex)
    ) {
      const prefix = `course/${courseHex}/content/lesson/${lessonHex}/`;
      logVideoRecovery('ATTEMPT', {
        lessonId: lessonHex,
        step: 'listObjectsV2',
        prefix,
        bucket,
        region,
      });
      const listed = await listLessonFolderVideoKeys(
        s3,
        bucket,
        courseHex,
        lessonHex,
        100,
      );
      for (const k of listed) {
        if (await headExists(s3, bucket, k)) {
          winner = k;
          break;
        }
      }
    }

    if (!winner) {
      lessonVideoFailures += 1;
      headMisses += 1;
      logVideoRecovery('FAILED', {
        lessonId: lessonHex,
        oldKey: (primaryNorm || sources[0] || '').slice(0, 240),
        candidatesTried: candidates.length,
        sampleCandidates: candidates.slice(0, 8),
        bucket,
        region,
      });
      bumpMediaMetric('video_recovery_failure', { lessonId: lessonHex });
      return;
    }

    if (primaryNorm === winner) {
      return;
    }

    headHits += 1;
    logVideoRecovery('SUCCESS', {
      lessonId: lessonHex,
      oldKey: (primaryNorm || sources[0] || '').slice(0, 240),
      recoveredKey: winner,
      bucket,
      region,
    });
    bumpMediaMetric('video_recovery_success', { lessonId: lessonHex });
    if (!dryRun) {
      await mongoDb.collection('lessons').updateOne(
        { _id: id as never },
        {
          $set: { videoObjectKey: winner, hasVideo: true },
          $unset: {
            videoUrl: '',
            videoKey: '',
            streamKey: '',
            videoS3Key: '',
          },
        },
      );
      updated += 1;
    }
  }

  if (names.has('courses') && !singleLessonOid && !singleAssetOid) {
    const cur = mongoDb.collection('courses').find(
      {
        $or: [
          { thumbnailUrl: { $exists: true, $nin: [null, ''] } },
          { thumbnailKey: { $exists: true, $nin: [null, ''] } },
        ],
      },
      { projection: { thumbnailUrl: 1, thumbnailKey: 1 } },
    );
    for await (const doc of cur) {
      const id = doc._id;
      await repairStringField('courses', id, 'thumbnailUrl', doc.thumbnailUrl);
      await repairStringField('courses', id, 'thumbnailKey', doc.thumbnailKey);
    }
  }

  if (names.has('lessons')) {
    const lessonProjection = {
      courseId: 1,
      videoObjectKey: 1,
      videoKey: 1,
      videoUrl: 1,
      streamKey: 1,
      videoS3Key: 1,
      thumbnailKey: 1,
    };
    if (singleLessonOid) {
      const doc = await mongoDb
        .collection('lessons')
        .findOne({ _id: singleLessonOid }, { projection: lessonProjection });
      if (doc) {
        const id = doc._id;
        await repairLessonVideos(doc as Record<string, unknown> & { _id?: unknown });
        await repairStringField('lessons', id, 'thumbnailKey', doc.thumbnailKey);
      }
    } else if (!singleAssetOid) {
      const cur = mongoDb.collection('lessons').find(
        {
          $or: [
            { videoObjectKey: { $exists: true, $nin: [null, ''] } },
            { videoKey: { $exists: true, $nin: [null, ''] } },
            { videoUrl: { $exists: true, $nin: [null, ''] } },
            { streamKey: { $exists: true, $nin: [null, ''] } },
            { videoS3Key: { $exists: true, $nin: [null, ''] } },
            { thumbnailKey: { $exists: true, $nin: [null, ''] } },
          ],
        },
        { projection: lessonProjection },
      );
      for await (const doc of cur) {
        const id = doc._id;
        await repairLessonVideos(doc as Record<string, unknown> & { _id?: unknown });
        await repairStringField('lessons', id, 'thumbnailKey', doc.thumbnailKey);
      }
    }
  }

  if (names.has(libraryColl)) {
    if (singleAssetOid) {
      const doc = await mongoDb
        .collection(libraryColl)
        .findOne({ _id: singleAssetOid }, { projection: { objectKey: 1 } });
      if (doc) {
        await repairStringField(libraryColl, doc._id, 'objectKey', doc.objectKey);
      }
    } else if (!singleLessonOid) {
      const cur = mongoDb.collection(libraryColl).find(
        { objectKey: { $exists: true, $nin: [null, ''] } },
        { projection: { objectKey: 1 } },
      );
      for await (const doc of cur) {
        const id = doc._id;
        await repairStringField(libraryColl, id, 'objectKey', doc.objectKey);
      }
    }
  } else if (!singleLessonOid && !singleAssetOid) {
    logRepair({
      phase: 'skip',
      reason: 'collection_not_found',
      expected: libraryColl,
      available: [...names].filter((n) => n.includes('library')).slice(0, 20),
    });
  }

  logRepair({
    phase: 'summary',
    dryRun,
    bucket,
    region,
    scannedFields: scanned,
    mongoWrites: dryRun ? 0 : updated,
    headHits,
    headMisses,
    lessonVideoFailures,
  });

  await conn.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
