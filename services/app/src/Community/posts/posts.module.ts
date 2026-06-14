import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostLegacyIndexCleanupService } from './post-legacy-index-cleanup.service';
import { CommentsService } from './comments.service';
import { PostSchema } from './schemas/posts/post.schema';
import { CommentSchema } from './schemas/posts/comment.schema';
import { AwsModule } from '../../common/aws/aws.module';
import { CommunitySocialModule } from '../social/community-social.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'Comment', schema: CommentSchema },
    ]),
    AwsModule,
    forwardRef(() => CommunitySocialModule),
  ],
  controllers: [PostsController],
  providers: [PostsService, CommentsService, PostLegacyIndexCleanupService],
  exports: [PostsService, CommentsService],
})
export class PostsModule {}
