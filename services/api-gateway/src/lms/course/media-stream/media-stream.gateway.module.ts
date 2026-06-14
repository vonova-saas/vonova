import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { S3Service } from 'src/common/utils/storage/s3.service';
import { MediaStreamGatewayController } from './media-stream.gateway.controller';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [MediaStreamGatewayController],
  providers: [JwtAuthGuard, S3Service],
})
export class MediaStreamGatewayModule {}
