import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Controller, Get } from '@nestjs/common';

@ApiTags('Gateway')
@Controller('api/v1')
export class AppController {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

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
  getAppHealth() {
    return this.natsClient.send({ cmd: 'getAppHealth' }, {});
  }

  @Get('lms/health')
  @ApiOperation({ summary: 'Get LMS service health' })
  @ApiResponse({ status: 200, description: 'LMS service is running' })
  getLmsHealth() {
    return this.natsClient.send({ cmd: 'getLmsHealth' }, {});
  }

  @Get('lms-ai/health')
  @ApiOperation({ summary: 'Get LMS AI service health' })
  @ApiResponse({ status: 200, description: 'LMS AI service is running' })
  getLmsAiHealth() {
    return this.natsClient.send({ cmd: 'getLmsAiHealth' }, {});
  }

  @Get('lms-ai/info')
  @ApiOperation({ summary: 'Get LMS AI service info' })
  @ApiResponse({ status: 200, description: 'LMS AI service info' })
  getLmsAiInfo() {
    return this.natsClient.send({ cmd: 'getLmsAiInfo' }, {});
  }
}
