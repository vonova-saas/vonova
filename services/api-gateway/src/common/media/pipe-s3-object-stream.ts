import { HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { Readable } from 'stream';

export type S3GetObjectStreamOutput = {
  Body?: unknown;
  ContentType?: string;
  ContentLength?: number;
  ContentRange?: string;
  ETag?: string;
  LastModified?: Date;
};

/**
 * Pipe an S3 GetObject body to an Express response with Range / cache headers.
 */
export function pipeS3ObjectStreamToResponse(
  res: Response,
  out: S3GetObjectStreamOutput,
  options: {
    contentType?: string;
    cacheControl?: string;
    contentDisposition?: string;
    route?: string;
  } = {},
): void {
  const partial = Boolean(out.ContentRange);
  res.status(partial ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK);
  if (options.contentType ?? out.ContentType) {
    res.setHeader('Content-Type', options.contentType ?? out.ContentType!);
  }
  if (out.ContentLength != null) {
    res.setHeader('Content-Length', String(out.ContentLength));
  }
  if (out.ContentRange) {
    res.setHeader('Content-Range', out.ContentRange);
  }
  res.setHeader('Accept-Ranges', 'bytes');
  if (out.ETag) {
    res.setHeader('ETag', out.ETag);
  }
  if (out.LastModified) {
    res.setHeader('Last-Modified', out.LastModified.toUTCString());
  }
  if (options.contentDisposition) {
    res.setHeader('Content-Disposition', options.contentDisposition);
  }
  res.setHeader(
    'Cache-Control',
    options.cacheControl ?? 'private, max-age=300',
  );

  const stream = out.Body as Readable | undefined;
  if (!stream || typeof stream.pipe !== 'function') {
    throw new HttpException('Empty body', HttpStatus.BAD_GATEWAY);
  }
  stream.on('error', (err: Error) => {
    if (!res.headersSent) {
      res.status(HttpStatus.BAD_GATEWAY).end();
    } else {
      res.destroy(err);
    }
  });
  console.log(
    '[MEDIA_STREAM_OK]',
    JSON.stringify({
      route: options.route ?? '-',
      contentType: options.contentType ?? out.ContentType ?? null,
      hasBody: !!stream,
    }),
  );
  stream.pipe(res);
}
