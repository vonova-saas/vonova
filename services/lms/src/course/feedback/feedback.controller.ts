import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CourseFeedbackService } from './feedback.service';
import { AnalyzeCourseFeedbackDto } from './dto/feedback.dto';

@Controller()
export class CourseFeedbackController {
  constructor(private readonly feedbackService: CourseFeedbackService) {}

  @MessagePattern({ cmd: 'app.courses.feedback.analyze' })
  analyzeFeedback(@Payload() dto: AnalyzeCourseFeedbackDto) {
    return this.feedbackService.analyzeCourseFeedback(dto);
  }
}