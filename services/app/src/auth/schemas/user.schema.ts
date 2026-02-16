import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Roles, RoleType } from '../../enums/role.enum';
import { hashValue, compareValue } from '../../utils/bcrypt';

export interface UserDocument extends User, Document {
  comparePassword(value: string): Promise<boolean>;
  omitPassword(): Omit<UserDocument, 'password'>;
}

export type UserDocumentType = UserDocument;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ select: true })
  password?: string;

  @Prop({ default: null })
  profilePicture!: string | null;

  @Prop({ type: String, enum: Object.keys(Roles), required: true })
  role!: RoleType;

  // When true, the user has submitted an instructor application and is waiting for approval
  @Prop({ default: false })
  pendingInstructor!: boolean;

  // Stores onboarding answers for both students and instructors (subjects, level, CV url, etc.)
  @Prop({ type: Object, default: null })
  onboardingAnswers!: Record<string, any> | null;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: null })
  lastLogin!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash password
UserSchema.pre('save', async function (next: any) {
  if (this.isModified('password')) {
    if (this.password) {
      this.password = await hashValue(this.password);
    }
  }
  next();
});

// Method to omit password
UserSchema.methods.omitPassword = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Method to compare password
UserSchema.methods.comparePassword = async function (value: string) {
  return compareValue(value, this.password);
};
