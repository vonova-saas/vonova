/**
 * Migration script to drop the unique index on file_hash
 * 
 * This allows multiple sessions for the same file (same file_hash).
 * 
 * Run this script once to update your database:
 * 
 * Option 1: Using MongoDB shell
 * db.PDF_SUMMARY.dropIndex("file_hash_1")
 * 
 * Option 2: Using this script (if you have a migration runner)
 * Or run it manually in your application startup
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DropFileHashUniqueIndexMigration {
  private readonly logger = new Logger(DropFileHashUniqueIndexMigration.name);

  constructor(@InjectConnection() private connection: Connection) { }

  async run(): Promise<void> {
    try {
      const collection = this.connection.db.collection('PDF_SUMMARY');

      // Get all indexes
      const indexes = await collection.indexes();
      this.logger.log('Current indexes:', JSON.stringify(indexes, null, 2));

      // Check if unique index on file_hash exists
      const fileHashUniqueIndex = indexes.find(
        (idx: any) => idx.key?.file_hash === 1 && idx.unique === true
      );

      if (fileHashUniqueIndex) {
        this.logger.log(`Found unique index on file_hash: ${fileHashUniqueIndex.name}`);

        // Drop the unique index
        await collection.dropIndex(fileHashUniqueIndex.name);
        this.logger.log(`Successfully dropped unique index: ${fileHashUniqueIndex.name}`);

        // Verify it's dropped
        const updatedIndexes = await collection.indexes();
        const stillExists = updatedIndexes.find(
          (idx: any) => idx.key?.file_hash === 1 && idx.unique === true
        );

        if (!stillExists) {
          this.logger.log('Unique index on file_hash successfully removed');
        } else {
          this.logger.warn('Unique index still exists after drop attempt');
        }
      } else {
        this.logger.log('No unique index on file_hash found - migration not needed');
      }

      // Ensure non-unique index exists for query performance
      const nonUniqueIndex = indexes.find(
        (idx: any) => idx.key?.file_hash === 1 && !idx.unique
      );

      if (!nonUniqueIndex) {
        await collection.createIndex({ file_hash: 1 }, { unique: false });
        this.logger.log('Created non-unique index on file_hash for query performance');
      }
    } catch (error) {
      this.logger.error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

