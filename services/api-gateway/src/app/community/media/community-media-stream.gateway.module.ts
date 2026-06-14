import { Module } from '@nestjs/common';
import { NatsClientModule } from 'src/common/nats-client/nats-client.module';
import { AuthGatewayModule } from 'src/app/auth/auth.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AppAuthS3Service } from 'src/common/utils/storage/app-auth-s3.service';
import { CommunityS3Service } from 'src/common/utils/storage/community-s3.service';
import { CommunityMediaStreamGatewayController } from './community-media-stream.gateway.controller';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [CommunityMediaStreamGatewayController],
  providers: [JwtAuthGuard, CommunityS3Service, AppAuthS3Service],
})
export class CommunityMediaStreamGatewayModule {}
