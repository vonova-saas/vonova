import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

export interface AIUsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  feature: string;
  date: string;
}

/**
 * AI Usage Guard - Protects AI endpoints with usage limits
 * 
 * Free Plan: 1 generation per day per feature
 * Pro Plan: Unlimited
 * 
 * Returns friendly error response with upgrade CTA when limit exceeded.
 */
@Injectable()
export class AIUsageGuard implements CanActivate {
  constructor(
    @Inject('NATS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Authentication required',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Determine feature from endpoint path
    const path = request.path || request.url || '';
    const feature = this.detectFeatureFromPath(path);

    if (!feature) {
      // If we can't detect feature, allow request (non-AI endpoint)
      return true;
    }

    // Check usage via LMS service
    try {
      const result = await firstValueFrom(
        this.client.send(
          { cmd: 'ai.usage.check' },
          {
            userId: user._id,
            role: user.role,
            feature,
          },
        ),
      ) as AIUsageCheckResult;

      if (!result.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: 'AI_DAILY_LIMIT_EXCEEDED',
            message: "You've reached your daily AI usage limit.",
            data: {
              feature,
              used: result.used,
              limit: result.limit,
              remaining: result.remaining,
              date: result.date,
              nextReset: this.getNextResetTime(),
            },
            upgradeCTA: {
              title: 'Upgrade to Pro for Unlimited AI',
              description: 'Get unlimited access to all AI features including roadmap generation, PDF summarization, and more.',
              buttonText: 'Upgrade Now',
              link: '/pricing',
              savings: 'Save 2+ hours daily',
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Attach usage info to request for potential use in controller
      request.aiUsage = result;
      return true;
    } catch (error) {
      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Log error but allow request (fail open for reliability)
      console.error('AI usage check failed:', error);
      return true;
    }
  }

  private detectFeatureFromPath(path: string): string | null {
    const pathLower = path.toLowerCase();

    if (pathLower.includes('roadmap')) {
      return 'ai_roadmap';
    }
    if (pathLower.includes('pdf')) {
      if (pathLower.includes('voice') || pathLower.includes('audio')) {
        return 'pdf_voice';
      }
      return 'pdf_summary';
    }
    if (pathLower.includes('article') || pathLower.includes('blog')) {
      return 'article_generation';
    }
    if (pathLower.includes('quiz')) {
      return 'quiz_generation';
    }
    if (pathLower.includes('problem')) {
      return 'problem_solving';
    }

    return null;
  }

  private getNextResetTime(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}
