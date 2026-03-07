import { Module } from '@nestjs/common';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../../app/auth/auth.module';
import { UploadGatewayController } from './upload.gateway.controller';
import { UploadGatewayService } from './upload.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [UploadGatewayController],
  providers: [UploadGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class UploadGatewayModule {}
