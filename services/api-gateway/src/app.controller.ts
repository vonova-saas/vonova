import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { config } from './config/gateway.config';

@ApiTags('Gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get gateway status' })
  @ApiResponse({ status: 200, description: 'Gateway is running' })
  getStatus() {
    return {
      message: 'API Gateway is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: Object.keys(config.services),
    };
  }
}

