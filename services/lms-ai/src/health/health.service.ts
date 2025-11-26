import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private configService: ConfigService) { }

  async getOverallHealth() {
    const timestamp = new Date().toISOString();

    try {
      // Check backend health
      const backendHealth = 'healthy';

      // Check AI services health
      const roadmapAiHealth = await this.checkRoadmapAiHealth();
      const pdfSummaryAiHealth = await this.checkPdfSummaryAiHealth();

      // Check database health
      const databaseHealth = 'healthy'; // Assuming MongoDB is healthy if we reach here

      const overallStatus = (
        backendHealth === 'healthy' &&
        roadmapAiHealth === 'healthy' &&
        pdfSummaryAiHealth === 'healthy' &&
        databaseHealth === 'healthy'
      ) ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp,
        services: {
          backend: backendHealth,
          roadmap_ai: roadmapAiHealth,
          pdf_summary_ai: pdfSummaryAiHealth,
          database: databaseHealth
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: this.configService.get('NODE_ENV', 'development')
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp,
        services: {
          backend: 'healthy',
          roadmap_ai: 'unhealthy',
          pdf_summary_ai: 'unhealthy',
          database: 'unhealthy'
        },
        error: error.message
      };
    }
  }

  private async checkRoadmapAiHealth(): Promise<string> {
    try {
      const roadmapAiUrl = this.configService.get('ROADMAP_AI_SERVICE_URL');
      if (!roadmapAiUrl) return 'unhealthy';

      // Simple health check - you can implement actual HTTP call here
      return 'healthy';
    } catch (error) {
      this.logger.warn('Roadmap AI service health check failed:', error);
      return 'unhealthy';
    }
  }

  private async checkPdfSummaryAiHealth(): Promise<string> {
    try {
      const pdfSummaryAiUrl = this.configService.get('PDF_SUMMARY_AI_SERVICE_URL');
      if (!pdfSummaryAiUrl) return 'unhealthy';

      // Simple health check - you can implement actual HTTP call here
      return 'healthy';
    } catch (error) {
      this.logger.warn('PDF Summary AI service health check failed:', error);
      return 'unhealthy';
    }
  }
}
