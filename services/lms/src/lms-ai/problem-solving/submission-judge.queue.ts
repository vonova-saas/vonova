import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SubmissionService } from './submission.service';

export type JudgeJobPayload = {
  submissionId: string;
};

@Injectable()
export class SubmissionJudgeQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubmissionJudgeQueue.name);
  private readonly queueName = 'problem-solving-judge';
  private connection?: IORedis;
  private queue?: Queue;
  private worker?: Worker;
  private enabled = false;
  private submissionService?: SubmissionService;

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    this.submissionService = this.moduleRef.get(SubmissionService, {
      strict: false,
    });
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
    try {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue(this.queueName, { connection: this.connection });
      this.worker = new Worker(
        this.queueName,
        async (job) => {
          const payload = job.data as JudgeJobPayload;
          if (!this.submissionService) {
            throw new Error('SubmissionService is unavailable');
          }
          await this.submissionService.processSubmissionJob(payload.submissionId);
        },
        { connection: this.connection, concurrency: 3 },
      );
      this.worker.on('failed', (job, err) => {
        this.logger.error(
          `Judge job failed: ${job?.id ?? 'unknown'} - ${err.message}`,
        );
      });
      this.enabled = true;
      this.logger.log(`BullMQ judge queue initialized: ${this.queueName}`);
    } catch (error) {
      this.enabled = false;
      this.logger.warn(
        `Redis not available; falling back to in-process judging. ${(error as Error).message}`,
      );
    }
  }

  async enqueue(payload: JudgeJobPayload) {
    if (!this.submissionService) {
      this.submissionService = this.moduleRef.get(SubmissionService, {
        strict: false,
      });
    }
    if (!this.submissionService) {
      throw new Error('SubmissionService is unavailable');
    }
    if (!this.enabled || !this.queue) {
      await this.submissionService.processSubmissionJob(payload.submissionId);
      return;
    }
    await this.queue.add('judge-submission', payload, {
      jobId: payload.submissionId,
      removeOnComplete: 1000,
      removeOnFail: 2000,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}
