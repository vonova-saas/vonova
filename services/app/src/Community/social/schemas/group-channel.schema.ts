import { Schema } from 'mongoose';

export const GROUP_CHANNEL_TYPES = [
  'GENERAL',
  'QUESTIONS',
  'RESOURCES',
  'ANNOUNCEMENTS',
  'CUSTOM',
] as const;

export const GroupChannelSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, default: '', maxlength: 400 },
    type: {
      type: String,
      enum: GROUP_CHANNEL_TYPES,
      default: 'GENERAL',
      index: true,
    },
    isDefault: { type: Boolean, default: false },
    /** Only INSTRUCTOR/OWNER/ADMIN can post when true. */
    isReadOnlyForMembers: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

GroupChannelSchema.index(
  { groupId: 1, name: 1 },
  { unique: true, name: 'unique_channel_per_group' },
);
