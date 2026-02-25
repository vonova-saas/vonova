import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { AssignmentGatewayController } from './assignment.gateway.controller';
import { AssignmentGatewayService } from './assignment.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [AssignmentGatewayController],
  providers: [AssignmentGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AssignmentGatewayModule {}
