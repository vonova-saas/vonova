import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'getLmsHealth' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'API Gateway Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'getLmsAiHealth' })
  getLmsAiHealth(): object {
    return {
      status: 'ok',
      service: 'LMS-AI (embedded in LMS)',
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'getLmsAiInfo' })
  getLmsAiInfo(): object {
    return {
      name: 'LMS-AI',
      description: 'Roadmap & PDF Summary AI (embedded in Vonova LMS)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
