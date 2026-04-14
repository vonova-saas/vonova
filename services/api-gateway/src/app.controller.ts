import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';

@ApiTags('Gateway')
@Controller('api/v1')
export class AppController {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) { }
  private static readonly HEALTH_TIMEOUT_MS = 3000;

  private async getServiceHealth(cmd: string, serviceName: string) {
    try {
      return await firstValueFrom(
        this.natsClient
          .send({ cmd }, {})
          .pipe(timeout(AppController.HEALTH_TIMEOUT_MS)),
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'No response from service';
      throw new ServiceUnavailableException(
        `${serviceName} health check failed: ${reason}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get gateway status' })
  @ApiResponse({ status: 200, description: 'Gateway is running' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'API Gateway Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  // Backend Services
  @Get('app/health')
  @ApiOperation({ summary: 'Get app service health' })
  @ApiResponse({ status: 200, description: 'App service is running' })
  async getAppHealth() {
    return this.getServiceHealth('getAppHealth', 'App service');
  }

  @Get('lms/health')
  @ApiOperation({ summary: 'Get LMS service health' })
  @ApiResponse({ status: 200, description: 'LMS service is running' })
  async getLmsHealth() {
    return this.getServiceHealth('getLmsHealth', 'LMS service');
  }

  @Get('lms-ai/health')
  @ApiOperation({ summary: 'Get LMS AI service health' })
  @ApiResponse({ status: 200, description: 'LMS AI service is running' })
  async getLmsAiHealth() {
    return this.getServiceHealth('getLmsAiHealth', 'LMS AI service');
  }

  @Get('admin/health')
  @ApiOperation({ summary: 'Get admin service health' })
  @ApiResponse({ status: 200, description: 'Admin service is running' })
  getAdminHealth() {
    return this.natsClient.send({ cmd: 'app.health.check' }, {});
  }

  @Get('admin/info')
  @ApiOperation({ summary: 'Get admin service info' })
  @ApiResponse({ status: 200, description: 'Admin service info' })
  getAdminInfo() {
    return this.natsClient.send({ cmd: 'app.info' }, {});
  }
}
