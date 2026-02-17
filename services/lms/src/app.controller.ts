import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'getLmsHealth' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'LMS Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
