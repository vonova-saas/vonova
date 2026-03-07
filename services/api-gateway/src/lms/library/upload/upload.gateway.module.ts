import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { UploadGatewayController } from './upload.gateway.controller';
import { UploadGatewayService } from './upload.gateway.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [UploadGatewayController],
  providers: [UploadGatewayService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class UploadGatewayModule {}
