import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schema/user.schema';
import { StorageModule } from '../../common/storage/storage.module';
import { OutboundNatsModule } from '../../common/nats/outbound-nats.module';
import { OnboardingService } from './onboarding.service';
import { StudentOnboardingController } from './student-onboarding.controller';
import { InstructorOnboardingController } from './instructor-onboarding.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    StorageModule,
    OutboundNatsModule,
  ],
  controllers: [StudentOnboardingController, InstructorOnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
