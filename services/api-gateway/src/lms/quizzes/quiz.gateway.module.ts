import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { QuizInstructorController } from './quiz.instructor.controller';
import { QuizStudentController } from './quiz.student.controller';
import { QuizGatewayService } from './quiz.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [QuizInstructorController, QuizStudentController],
  providers: [QuizGatewayService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class QuizGatewayModule {}
