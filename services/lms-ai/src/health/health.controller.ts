import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get()
  @ApiOperation({ summary: 'Get overall platform health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        services: {
          type: 'object',
          properties: {
            backend: { type: 'string', example: 'healthy' },
            roadmap_ai: { type: 'string', example: 'healthy' },
            pdf_summary_ai: { type: 'string', example: 'healthy' },
            database: { type: 'string', example: 'healthy' }
          }
        }
      }
    }
  })
  async getOverallHealth() {
    return this.healthService.getOverallHealth();
  }
}
