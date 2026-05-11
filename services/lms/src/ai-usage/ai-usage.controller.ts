import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AIUsageService } from './ai-usage.service';
import type { AIFeature } from './schema/ai-usage.schema';

/**
 * Feature mapping for backward compatibility
 * Maps old feature names to new AIFeature enum values
 */
const FEATURE_MAP: Record<string, AIFeature> = {
  'ai_roadmap': 'ROADMAP_GENERATION',
  'pdf_summary': 'PDF_SUMMARY',
  'pdf_voice': 'VOICE_CHAT',
  'article_generation': 'ARTICLE_GENERATION',
  'quiz_generation': 'QUIZ_GENERATION',
  'problem_solving': 'PROBLEM_SOLVING',
};

@Controller('ai-usage')
export class AIUsageController {
  constructor(private readonly aiUsageService: AIUsageService) { }

  @MessagePattern({ cmd: 'ai-usage.track' })
  async trackUsage(
    @Payload('userId') userId: string,
    @Payload('feature') feature: AIFeature,
  ) {
    const usage = await this.aiUsageService.trackUsage(userId, feature);
    return { message: 'Usage tracked successfully', data: usage };
  }

  @MessagePattern({ cmd: 'ai-usage.getDaily' })
  async getDailyUsage(
    @Payload('userId') userId: string,
    @Payload('feature') feature: AIFeature,
  ) {
    const count = await this.aiUsageService.getDailyUsage(userId, feature);
    return { message: 'Daily usage retrieved successfully', data: { count } };
  }

  @MessagePattern({ cmd: 'ai-usage.getAllDaily' })
  async getAllDailyUsage(@Payload('userId') userId: string) {
    const usage = await this.aiUsageService.getAllDailyUsage(userId);
    return { message: 'All daily usage retrieved successfully', data: usage };
  }

  @MessagePattern({ cmd: 'ai-usage.checkLimit' })
  async checkUsageLimit(
    @Payload('userId') userId: string,
    @Payload('role') role: string,
    @Payload('feature') feature: AIFeature,
  ) {
    const result = await this.aiUsageService.checkUsageLimit(userId, role, feature);
    return { message: 'Usage limit checked successfully', data: result };
  }

  @MessagePattern({ cmd: 'ai-usage.getHistory' })
  async getUsageHistory(
    @Payload('userId') userId: string,
    @Payload('startDate') startDate: Date,
    @Payload('endDate') endDate: Date,
  ) {
    const history = await this.aiUsageService.getUsageHistory(userId, startDate, endDate);
    return { message: 'Usage history retrieved successfully', data: history };
  }

  /**
   * Check usage limit - supports both old and new feature names
   * Used by API Gateway guard for pre-flight checks
   */
  @MessagePattern({ cmd: 'ai.usage.check' })
  async checkUsage(
    @Payload('userId') userId: string,
    @Payload('role') role: string,
    @Payload('feature') feature: string,
  ) {
    // Map old feature names to new ones
    const mappedFeature = FEATURE_MAP[feature] || feature as AIFeature;
    const result = await this.aiUsageService.checkUsageLimit(userId, role, mappedFeature);

    return {
      message: 'Usage checked successfully',
      data: {
        allowed: result.allowed,
        used: result.currentCount,
        limit: result.limit,
        remaining: result.remaining,
        feature,
        mappedFeature,
      },
    };
  }
}
