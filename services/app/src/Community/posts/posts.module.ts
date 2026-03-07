import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CommentsService } from './comments.service';
import { PostSchema } from './schemas/posts/post.schema';
import { CommentSchema } from './schemas/posts/comment.schema';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Post', schema: PostSchema },
      { name: 'Comment', schema: CommentSchema },
    ]),
    AwsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, CommentsService],
  exports: [PostsService, CommentsService],
})
export class PostsModule {}
