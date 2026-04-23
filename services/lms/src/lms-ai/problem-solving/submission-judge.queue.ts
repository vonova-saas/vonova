import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SubmissionService } from './submission.service';

export type JudgeJobPayload = {
  submissionId: string;
};

@Injectable()
export class SubmissionJudgeQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubmissionJudgeQueue.name);
  private readonly queueName = 'problem-solving-memory-queue';
  private readonly maxConcurrentJobs = 3;
  private readonly pollIntervalMs = 150;
  private readonly jobs: JudgeJobPayload[] = [];
  private runningJobs = 0;
  private loopHandle?: NodeJS.Timeout;
  private submissionService?: SubmissionService;

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.submissionService = this.moduleRef.get(SubmissionService, {
      strict: false,
    });
    this.loopHandle = setInterval(() => {
      void this.processNext();
    }, this.pollIntervalMs);
    this.logger.log(
      `In-memory judge queue initialized: ${this.queueName} (concurrency=${this.maxConcurrentJobs})`,
    );
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
    this.jobs.push(payload);
  }

  async onModuleDestroy() {
    if (this.loopHandle) {
      clearInterval(this.loopHandle);
      this.loopHandle = undefined;
    }
  }

  private async processNext() {
    if (this.runningJobs >= this.maxConcurrentJobs) return;
    const job = this.jobs.shift();
    if (!job) return;
    if (!this.submissionService) return;

    this.runningJobs += 1;
    try {
      await this.submissionService.processSubmissionJob(job.submissionId);
    } catch (error) {
      this.logger.error(
        `Judge job failed: ${job.submissionId} - ${(error as Error).message}`,
      );
    } finally {
      this.runningJobs -= 1;
    }
  }
}
