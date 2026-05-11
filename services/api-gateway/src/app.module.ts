import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { NatsClientModule } from './common/nats-client/nats-client.module';
import { BotProtectionMiddleware } from './common/middleware/bot-protection.middleware';
import { RequestSanitizerMiddleware } from './common/middleware/request-sanitizer.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { SwaggerService } from './common/services/swagger.service';
import { LoggerService } from './common/services/logger.service';
import { WaitlistGatewayModule } from './app/waitlist/waitlist.module';
import { SettingsGatewayModule } from './app/settings/settings.module';
import { AccountGatewayModule } from './app/account/account.module';
import { BillingGatewayModule } from './app/billing/billing.module';
import { SupportGatewayModule } from './app/support/support.module';
import { FeedbackGatewayModule } from './app/feedback/feedback.module';
import { AuthGatewayModule } from './app/auth/auth.module';
import { OnboardingGatewayModule } from './app/onboarding/onboarding.gateway.module';
import { RoadmapGatewayModule } from './lms-ai/roadmap/roadmap.module';
import { PdfSummaryGatewayModule } from './lms-ai/pdf-summary/pdf-summary.module';
import { ProblemSolvingGatewayModule } from './lms-ai/problem-solving/problem-solving.module';
import { FaviconController } from './common/controllers/favicon.controller';
import { RootRedirectController } from './common/controllers/root-redirect.controller';
import { QuizGatewayModule } from './lms/quizzes/quiz.gateway.module';
import { AssignmentGatewayModule } from './lms/assignments/assignment.gateway.module';
import { CourseGatewayModule } from './lms/course/course/course.gateway.module';
import { ChapterGatewayModule } from './lms/course/chapter/chapter.gateway.module';
import { LessonGatewayModule } from './lms/course/lesson/lesson.gateway.module';
import { ContentGatewayModule } from './lms/course/content/content.gateway.module';
import { ProgressGatewayModule } from './lms/course/progress/progress.gateway.module';
import { EnrollGatewayModule } from './lms/course/enroll/enroll.gateway.module';
import { ReviewCourseGatewayModule } from './lms/course/review-course/review-course.gateway.module';
import { BookGatewayModule } from './lms/library/book/book.gateway.module';
import { PresentationGatewayModule } from './lms/library/presentation/presentation.gateway.module';
import { GuideGatewayModule } from './lms/library/guide/guide.gateway.module';
import { LibraryGatewayModule } from './lms/library/library/library.gateway.module';
import { FavoriteGatewayModule } from './lms/library/favorite/favorite.gateway.module';
import { ReviewGatewayModule } from './lms/library/review/review.gateway.module';
import { ReaderGatewayModule } from './lms/library/reader/reader.gateway.module';
import { UploadGatewayModule } from './lms/library/upload/upload.gateway.module';
import { AdminGatewayModule } from './admin/admin.module';
import { AdminAuthGatewayModule } from './admin-auth/admin-auth.module';
import { CommunityGatewayModule } from './app/community/community.module';
import { SubscriptionGatewayModule } from './lms/subscription/subscription.gateway.module';
import { PaymentsGatewayModule } from './lms/payments/payments.gateway.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    // Nats Client
    NatsClientModule,
    //* App Services
    WaitlistGatewayModule,
    AuthGatewayModule,
    OnboardingGatewayModule,
    SettingsGatewayModule,
    AccountGatewayModule,
    BillingGatewayModule,
    SupportGatewayModule,
    FeedbackGatewayModule,
    //* LMS Services
    QuizGatewayModule,
    AssignmentGatewayModule,
    CourseGatewayModule,
    ChapterGatewayModule,
    LessonGatewayModule,
    ContentGatewayModule,
    ProgressGatewayModule,
    EnrollGatewayModule,
    ReviewCourseGatewayModule,
    BookGatewayModule,
    PresentationGatewayModule,
    GuideGatewayModule,
    LibraryGatewayModule,
    FavoriteGatewayModule,
    ReviewGatewayModule,
    ReaderGatewayModule,
    UploadGatewayModule,
    //* Admin Services
    AdminGatewayModule,
    AdminAuthGatewayModule,
    //* Community Services
    CommunityGatewayModule,
    //* LMS AI Services
    RoadmapGatewayModule,
    PdfSummaryGatewayModule,
    ProblemSolvingGatewayModule,
    //* Subscription & Payments
    SubscriptionGatewayModule,
    PaymentsGatewayModule,
    //* Generative AI Services
  ],
  controllers: [AppController, FaviconController, RootRedirectController],
  providers: [
    SwaggerService,
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestSanitizerMiddleware).forRoutes('*');
    consumer.apply(CsrfMiddleware).forRoutes('*');

    consumer
      .apply(BotProtectionMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'app/health', method: RequestMethod.GET },
        { path: 'lms/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
