import { Schema } from 'mongoose';

export const CommunityFollowSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

CommunityFollowSchema.index(
  { followerId: 1, followingId: 1 },
  { unique: true, name: 'unique_follow_pair' },
);
