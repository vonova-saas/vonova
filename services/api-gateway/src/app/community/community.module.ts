import { Module } from '@nestjs/common';
import { ArticlesGatewayController } from './articles/articles.controller';
import { PostsGatewayController } from './posts/posts.controller';
import { CommunitySocialGatewayController } from './social.gateway.controller';
import { ReportsGatewayController } from './reports.gateway.controller';
import { ArticlesGatewayService } from './articles/articles.service';
import { PostsGatewayService } from './posts/posts.service';
import { CommunitySocialGatewayService } from './social.gateway.service';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';
import { CommunityS3Service } from '../../common/utils/storage/community-s3.service';
import { CommunitySocketGatewayModule } from '../../community/socket/community.gateway.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule, CommunitySocketGatewayModule],
  controllers: [
    ArticlesGatewayController,
    PostsGatewayController,
    CommunitySocialGatewayController,
    ReportsGatewayController,
  ],
  providers: [
    ArticlesGatewayService,
    PostsGatewayService,
    CommunitySocialGatewayService,
    CommunityS3Service,
    JwtAuthGuard,
  ],
  exports: [
    ArticlesGatewayService,
    PostsGatewayService,
    CommunitySocialGatewayService,
    JwtAuthGuard,
  ],
})
export class CommunityGatewayModule {}
