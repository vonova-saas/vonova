import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class StudentOnboarding {
  @Prop({ required: true, trim: true })
  track: string;

  @Prop({ required: true, trim: true })
  level: string;

  @Prop({ required: true, trim: true })
  goal: string;

  @Prop({ required: true, trim: true })
  experience: string;

  @Prop({ required: true, trim: true })
  timeCommitment: string;
}

export const StudentOnboardingSchema =
  SchemaFactory.createForClass(StudentOnboarding);

@Schema({ _id: false })
export class InstructorOnboarding {
  @Prop({ required: true, trim: true })
  track: string;

  @Prop({ required: true, min: 1 })
  experienceYears: number;

  @Prop({ required: true, trim: true })
  bio: string;

  @Prop({ required: true, trim: true })
  teachingStyle: string;

  @Prop({ required: true, trim: true })
  motivation: string;
}

export const InstructorOnboardingSchema =
  SchemaFactory.createForClass(InstructorOnboarding);

@Schema({ _id: false })
export class UserOnboarding {
  @Prop({ type: StudentOnboardingSchema, required: false })
  student?: StudentOnboarding;

  @Prop({ type: InstructorOnboardingSchema, required: false })
  instructor?: InstructorOnboarding;
}

export const UserOnboardingSchema = SchemaFactory.createForClass(UserOnboarding);
