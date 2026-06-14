import { Schema } from 'mongoose';
import {
  MODERATION_RESOLUTION_ACTIONS,
  PLATFORM_AUDIT_ENTITY_TYPES,
} from '../moderation.constants';

export const PlatformModerationAuditSchema = new Schema(
  {
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: MODERATION_RESOLUTION_ACTIONS,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: PLATFORM_AUDIT_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
      sparse: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'ContentReport',
      default: null,
      index: true,
      sparse: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      default: null,
      index: true,
      sparse: true,
    },
    reason: { type: String, default: '', maxlength: 2000 },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

PlatformModerationAuditSchema.index({ createdAt: -1 });
PlatformModerationAuditSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
