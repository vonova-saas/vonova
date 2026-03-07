import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { ContentGatewayController } from './content.gateway.controller';
import { ContentGatewayService } from './content.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ContentGatewayController],
  providers: [ContentGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class ContentGatewayModule {}
