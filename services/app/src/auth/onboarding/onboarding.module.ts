import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schema/user.schema';
import { OutboundNatsModule } from '../../common/nats/outbound-nats.module';
import { OnboardingService } from './onboarding.service';
import { StudentOnboardingController } from './student-onboarding.controller';
import { InstructorOnboardingController } from './instructor-onboarding.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OutboundNatsModule,
  ],
  controllers: [StudentOnboardingController, InstructorOnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule { }
