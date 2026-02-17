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
  getAppHealth() {
    return this.natsClient.send({ cmd: 'getAppHealth' }, {});
  }
}
