/**
 * Fail-fast environment validation for the API gateway.
 *
 * The gateway is mostly a proxy: it forwards requests over NATS to internal
 * microservices and only touches AWS S3 directly for community uploads. JWT
 * secrets, Mongo URLs and other auth-critical values live inside those
 * downstream services and are validated there.
 *
 * Rules:
 *   - **Hard fail** if anything the gateway genuinely needs to boot is
 *     missing (currently nothing in dev; `NATS_URL` is recommended but
 *     `services/api-gateway` falls back to a default).
 *   - **Hard fail in production** for vars whose absence would silently
 *     break a critical feature path.
 *   - **Warn** for optional vars so the operator can spot a misconfigured
 *     environment without crashing the dev loop.
 *
 * Secret values are never logged — only their names.
 */

import { Logger } from '@nestjs/common';

const REQUIRED_ALWAYS: readonly string[] = [];

const REQUIRED_IN_PRODUCTION: readonly string[] = ['NATS_URL'];

const RECOMMENDED_FOR_COMMUNITY_UPLOADS: readonly string[] = [
  'AWS_S3_BUCKET_APP_COMM',
  'AWS_S3_REGION_APP_COMM',
  'AWS_S3_ACCESS_KEY_ID_APP_COMM',
  'AWS_S3_SECRET_ACCESS_KEY_APP_COMM',
];

function missing(keys: readonly string[]): string[] {
  return keys.filter((k) => !process.env[k]);
}

export function validateEnv(): void {
  const logger = new Logger('EnvValidator');
  const isProd = (process.env.NODE_ENV ?? '').toLowerCase() === 'production';

  const fatal: string[] = [...missing(REQUIRED_ALWAYS)];
  if (isProd) fatal.push(...missing(REQUIRED_IN_PRODUCTION));
  if (fatal.length) {
    const msg = `Missing required environment variables: ${fatal.join(', ')}`;
    logger.error(msg);
    throw new Error(msg);
  }

  const uploadMissing = missing(RECOMMENDED_FOR_COMMUNITY_UPLOADS);
  if (uploadMissing.length) {
    logger.warn(
      `Community upload features will be disabled until these are set: ${uploadMissing.join(', ')}`,
    );
  }
}
