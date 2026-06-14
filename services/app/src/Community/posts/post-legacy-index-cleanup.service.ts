import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { PostDocument } from './schemas/posts/post.schema';

/**
 * Drops the legacy Mongo unique index on `{ author, content }` which blocked
 * legitimate repeats across days and broke reposts with empty captions.
 */
@Injectable()
export class PostLegacyIndexCleanupService implements OnModuleInit {
  private readonly log = new Logger(PostLegacyIndexCleanupService.name);

  constructor(@InjectModel('Post') private readonly postModel: Model<PostDocument>) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.postModel.collection.dropIndex('unique_user_content');
      this.log.log('Dropped legacy index unique_user_content on posts collection');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/index not found|ns not found/i.test(msg)) return;
      this.log.warn(`Could not drop legacy unique_user_content index: ${msg}`);
    }
  }
}
