import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { AssignmentGatewayController } from './assignment.gateway.controller';
import { AssignmentGatewayService } from './assignment.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [AssignmentGatewayController],
  providers: [AssignmentGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AssignmentGatewayModule {}
