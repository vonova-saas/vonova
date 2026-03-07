import { Module } from '@nestjs/common';
import { AccountGatewayController } from './account.controller';
import { AccountGatewayService } from './account.service';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [AccountGatewayController],
  providers: [AccountGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AccountGatewayModule { }
