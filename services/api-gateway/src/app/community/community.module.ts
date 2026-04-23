import { Module } from '@nestjs/common';
import { ArticlesGatewayController } from './articles/articles.controller';
import { PostsGatewayController } from './posts/posts.controller';
import { ArticlesGatewayService } from './articles/articles.service';
import { PostsGatewayService } from './posts/posts.service';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';
import { CommunityS3Service } from '../../common/utils/storage/community-s3.service';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [ArticlesGatewayController, PostsGatewayController],
  providers: [
    ArticlesGatewayService,
    PostsGatewayService,
    CommunityS3Service,
    JwtAuthGuard,
  ],
  exports: [ArticlesGatewayService, PostsGatewayService, JwtAuthGuard],
})
export class CommunityGatewayModule {}
