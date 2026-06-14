import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../auth/schema/user.schema';
import { CommunitySocialController } from './community-social.controller';
import { SocialHubService } from './social-hub.service';
import { AiModerationService } from './ai-moderation.service';
import { CommunityFollowSchema } from './schemas/follow.schema';
import { DirectConversationSchema } from './schemas/conversation.schema';
import { DirectMessageSchema } from './schemas/message.schema';
import { GroupMessageSchema } from './schemas/group-message.schema';
import { CommunityNotificationSchema } from './schemas/notification.schema';
import { CommunityGroupSchema } from './schemas/community-group.schema';
import { GroupChannelSchema } from './schemas/group-channel.schema';
import { CommunityModerationLogSchema } from './schemas/moderation-log.schema';
import { CommunityModerationResultSchema } from './schemas/moderation-result.schema';
import { ContentReportSchema } from './schemas/content-report.schema';
import { PlatformModerationAuditSchema } from './schemas/platform-moderation-audit.schema';
import { PlatformUserSanctionSchema } from './schemas/platform-user-sanction.schema';
import { AutoModerationService } from './auto-moderation.service';
import { ContentReportService } from './content-report.service';
import { AiUserSubscriptionSchema } from './schemas/ai-subscription.schema';
import { AiUsageLogSchema } from './schemas/ai-usage-log.schema';
import { AwsModule } from '../../common/aws/aws.module';
import { OutboundNatsModule } from '../../common/nats/outbound-nats.module';
import { UserNotificationPreferencesSchema } from './schemas/user-notification-preferences.schema';
import { NotificationUnreadCounterSchema } from './schemas/notification-unread-counter.schema';
import { CourseEnrollmentAudienceService } from './notifications/course-enrollment-audience.service';
import { NotificationAudienceResolver } from './notifications/notification-audience.resolver';
import { NotificationPreferencesService } from './notifications/notification-preferences.service';
import { NotificationUnreadService } from './notifications/notification-unread.service';
import { NotificationDispatchService } from './notifications/notification-dispatch.service';

@Module({
  imports: [
    AwsModule,
    OutboundNatsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'CommunityFollow', schema: CommunityFollowSchema },
      { name: 'DirectConversation', schema: DirectConversationSchema },
      { name: 'DirectMessage', schema: DirectMessageSchema },
      { name: 'GroupMessage', schema: GroupMessageSchema },
      { name: 'CommunityNotification', schema: CommunityNotificationSchema },
      {
        name: 'UserNotificationPreferences',
        schema: UserNotificationPreferencesSchema,
      },
      {
        name: 'NotificationUnreadCounter',
        schema: NotificationUnreadCounterSchema,
      },
      { name: 'CommunityGroup', schema: CommunityGroupSchema },
      { name: 'GroupChannel', schema: GroupChannelSchema },
      { name: 'CommunityModerationLog', schema: CommunityModerationLogSchema },
      { name: 'CommunityModerationResult', schema: CommunityModerationResultSchema },
      { name: 'ContentReport', schema: ContentReportSchema },
      { name: 'PlatformModerationAudit', schema: PlatformModerationAuditSchema },
      { name: 'PlatformUserSanction', schema: PlatformUserSanctionSchema },
      { name: 'AiUserSubscription', schema: AiUserSubscriptionSchema },
      { name: 'AiUsageLog', schema: AiUsageLogSchema },
    ]),
  ],
  controllers: [CommunitySocialController],
  providers: [
    SocialHubService,
    AutoModerationService,
    ContentReportService,
    AiModerationService,
    CourseEnrollmentAudienceService,
    NotificationAudienceResolver,
    NotificationPreferencesService,
    NotificationUnreadService,
    NotificationDispatchService,
  ],
  exports: [
    SocialHubService,
    AutoModerationService,
    ContentReportService,
    AiModerationService,
    NotificationDispatchService,
    NotificationPreferencesService,
    NotificationUnreadService,
  ],
})
export class CommunitySocialModule {}
