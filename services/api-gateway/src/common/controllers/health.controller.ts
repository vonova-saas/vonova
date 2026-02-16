import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GatewayService } from '../../modules/gateway/gateway.service';
import { config } from '../../config/gateway.config';
import axios from 'axios';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly gatewayService: GatewayService) { }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Gateway and services health status' })
  async healthCheck() {
    const serviceHealth = await Promise.allSettled(
      Object.values(config.services).map(async (service) => {
        try {
          // Try the configured health check endpoint
          let healthUrl = `${service.url}${service.healthCheck}`;
          let response;

          try {
            response = await axios.get(healthUrl, { timeout: 5000 });
          } catch (err) {
            // Fallback: try root health endpoint
            if (service.healthCheck !== '/') {
              healthUrl = `${service.url}/health`;
              response = await axios.get(healthUrl, { timeout: 5000 });
            } else {
              throw err;
            }
          }

          return {
            service: service.name,
            status: 'healthy',
            response: response.status,
            url: service.url,
            healthCheck: service.healthCheck,
          };
        } catch (error) {
          return {
            service: service.name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            url: service.url,
            healthCheck: service.healthCheck,
          };
        }
      }),
    );

    const results = serviceHealth.map((result) =>
      result.status === 'fulfilled' ? result.value : result.reason,
    );

    const allHealthy = results.every((r: any) => r.status === 'healthy');

    return {
      gateway: 'healthy',
      overall: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results,
    };
  }
}

