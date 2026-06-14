import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CommunityMediaStreamService } from './community-media-stream.service';

@Controller()
export class CommunityMediaController {
  constructor(private readonly media: CommunityMediaStreamService) {}

  @MessagePattern({ cmd: 'app.media.community.userAvatarStreamMeta' })
  userAvatarStreamMeta(
    @Payload() data: { userId: string; requesterId: string },
  ) {
    return this.media.getUserAvatarStreamMeta(data.userId, data.requesterId);
  }

  @MessagePattern({ cmd: 'app.media.community.userCoverStreamMeta' })
  userCoverStreamMeta(@Payload() data: { userId: string }) {
    return this.media.getUserCoverStreamMeta(data.userId);
  }

  @MessagePattern({ cmd: 'app.media.community.postImageStreamMeta' })
  postImageStreamMeta(
    @Payload() data: { postId: string; index: number; requesterId: string },
  ) {
    return this.media.getPostImageStreamMeta(
      data.postId,
      data.index,
      data.requesterId,
    );
  }

  @MessagePattern({ cmd: 'app.media.community.articleCoverStreamMeta' })
  articleCoverStreamMeta(@Payload() data: { articleId: string }) {
    return this.media.getArticleCoverStreamMeta(data.articleId);
  }

  @MessagePattern({ cmd: 'app.media.community.articleBlockImageStreamMeta' })
  articleBlockImageStreamMeta(
    @Payload() data: { articleId: string; blockIndex: number },
  ) {
    return this.media.getArticleBlockImageStreamMeta(
      data.articleId,
      data.blockIndex,
    );
  }

  @MessagePattern({ cmd: 'app.media.community.dmAttachmentStreamMeta' })
  dmAttachmentStreamMeta(
    @Payload()
    data: {
      conversationId: string;
      messageId: string;
      index: number;
      requesterId: string;
    },
  ) {
    return this.media.getDmAttachmentStreamMeta(
      data.conversationId,
      data.messageId,
      data.index,
      data.requesterId,
    );
  }

  @MessagePattern({ cmd: 'app.media.community.groupAttachmentStreamMeta' })
  groupAttachmentStreamMeta(
    @Payload()
    data: {
      groupId: string;
      messageId: string;
      index: number;
      requesterId: string;
    },
  ) {
    return this.media.getGroupAttachmentStreamMeta(
      data.groupId,
      data.messageId,
      data.index,
      data.requesterId,
    );
  }
}
