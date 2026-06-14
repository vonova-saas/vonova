import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { CommunityGatewayModule } from '../../app/community/community.module';
import { CommunitySocketGatewayModule } from '../../community/socket/community.gateway.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProblemSolvingGatewayController } from './problem-solving.controller';
import { ProblemSolvingGatewayService } from './problem-solving.service';
import { InstructorGuard } from './guards/instructor.guard';
import { StudentGuard } from './guards/student.guard';

@Module({
  imports: [
    NatsClientModule,
    AuthGatewayModule,
    CommunityGatewayModule,
    CommunitySocketGatewayModule,
  ],
  controllers: [ProblemSolvingGatewayController],
  providers: [
    ProblemSolvingGatewayService,
    JwtAuthGuard,
    InstructorGuard,
    StudentGuard,
  ],
})
export class ProblemSolvingGatewayModule {}
