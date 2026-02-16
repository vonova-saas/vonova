import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Roles, RoleType } from '../../enums/role.enum';
import { hashValue, compareValue } from '../../utils/bcrypt';

export interface UserDocument extends User, Document {
  comparePassword(value: string): Promise<boolean>;
  omitPassword(): Omit<UserDocument, 'password'>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ select: true })
  password?: string;

  @Prop({ type: String, default: null })
  profilePicture?: string | null;

  @Prop({ type: String, enum: Object.keys(Roles), required: true })
  role!: RoleType;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  lastLogin?: Date | null;

  @Prop({ default: false })
  pendingInstructor?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    if (this.password) {
      this.password = await hashValue(this.password);
    }
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (value: string) {
  if (!this.password) {
    return false;
  }
  return compareValue(value, this.password);
};

// Method to omit password
UserSchema.methods.omitPassword = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

