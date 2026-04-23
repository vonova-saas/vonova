import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ProblemSolvingAiClient {
  private readonly logger = new Logger(ProblemSolvingAiClient.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('PROBLEM_SOLVING_AI_BASE_URL');
    if (!baseURL?.trim()) {
      throw new Error('PROBLEM_SOLVING_AI_BASE_URL is required');
    }

    this.client = axios.create({
      baseURL: baseURL.trim(),
      timeout: Number(this.configService.get('PROBLEM_SOLVING_AI_TIMEOUT_MS') || 15000),
    });
  }

  async generateHint(payload: {
    problem: string;
    submit_code: string;
    testCases: string;
    testcase_fail: string;
    language_hint: string;
  }): Promise<string> {
    try {
      const { data } = await this.client.post('/generate/hint', payload);
      return this.extractResponseText(data);
    } catch (error) {
      this.logger.error(`Hint generation failed: ${this.extractError(error)}`);
      throw new InternalServerErrorException('Failed to generate hint');
    }
  }

  async generateSolution(payload: {
    problem: string;
    testCases: string;
    language: string;
    language_explanation: string;
  }): Promise<string> {
    try {
      const { data } = await this.client.post('/generate/solution', payload);
      return this.extractResponseText(data);
    } catch (error) {
      this.logger.error(`Solution generation failed: ${this.extractError(error)}`);
      throw new InternalServerErrorException('Failed to generate solution');
    }
  }

  private extractResponseText(data: unknown): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data) {
      const obj = data as Record<string, unknown>;
      const message = obj.response ?? obj.result ?? obj.text ?? obj.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
      return JSON.stringify(data);
    }
    return String(data);
  }

  private extractError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

