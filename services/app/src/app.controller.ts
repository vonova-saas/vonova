import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'getAppHealth' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'APP Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
