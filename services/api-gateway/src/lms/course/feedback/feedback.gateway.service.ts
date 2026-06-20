import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CourseFeedbackGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  analyzeFeedback(payload: {
    courseId: string;
    userId: string;
    role: string;
    text: string;
  }) {
    return this.client.send({ cmd: 'app.courses.feedback.analyze' }, payload);
  }
}