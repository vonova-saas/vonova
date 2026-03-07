import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { ReaderGatewayController } from './reader.gateway.controller';
import { ReaderGatewayService } from './reader.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ReaderGatewayController],
  providers: [ReaderGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ReaderGatewayModule {}
