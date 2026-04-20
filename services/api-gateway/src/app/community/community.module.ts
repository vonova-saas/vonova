import { Module } from '@nestjs/common';
import { ArticlesGatewayController } from './articles/articles.controller';
import { PostsGatewayController } from './posts/posts.controller';
import { ArticlesGatewayService } from './articles/articles.service';
import { PostsGatewayService } from './posts/posts.service';
import { NatsClientModule } from '../../common/nats-client/nats-client.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthGatewayModule } from '../auth/auth.module';

@Module({
  imports: [NatsClientModule, AuthGatewayModule],
  controllers: [
    ArticlesGatewayController,
    PostsGatewayController,
  ],
  providers: [
    ArticlesGatewayService,
    PostsGatewayService,
    JwtAuthGuard,
  ],
  exports: [
    ArticlesGatewayService,
    PostsGatewayService,
    JwtAuthGuard,
  ],
})
export class CommunityGatewayModule {}
