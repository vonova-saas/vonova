import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../auth/schema/user.schema';
import { PostSchema } from '../../Community/posts/schemas/posts/post.schema';
import { ArticleSchema } from '../../Community/articles/schemas/article.schema';
import { DirectConversationSchema } from '../../Community/social/schemas/conversation.schema';
import { DirectMessageSchema } from '../../Community/social/schemas/message.schema';
import { GroupMessageSchema } from '../../Community/social/schemas/group-message.schema';
import { CommunityGroupSchema } from '../../Community/social/schemas/community-group.schema';
import { AwsModule } from '../aws/aws.module';
import { CommunityMediaController } from './community-media.controller';
import { CommunityMediaStreamService } from './community-media-stream.service';

@Module({
  imports: [
    AwsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Post', schema: PostSchema },
      { name: 'Article', schema: ArticleSchema },
      { name: 'DirectConversation', schema: DirectConversationSchema },
      { name: 'DirectMessage', schema: DirectMessageSchema },
      { name: 'GroupMessage', schema: GroupMessageSchema },
      { name: 'CommunityGroup', schema: CommunityGroupSchema },
    ]),
  ],
  controllers: [CommunityMediaController],
  providers: [CommunityMediaStreamService],
  exports: [CommunityMediaStreamService],
})
export class CommunityMediaModule {}
