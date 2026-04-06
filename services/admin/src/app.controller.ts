import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'app.health.check' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'Admin Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'app.info' })
  getInfo(): object {
    return {
      name: 'Admin Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}