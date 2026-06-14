import { Schema } from 'mongoose';
import {
  MODERATION_RESOLUTION_ACTIONS,
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
} from '../moderation.constants';

export const ContentReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: REPORT_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    /** Optional group context for course/group-scoped targets. */
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      default: null,
      index: true,
      sparse: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
      index: true,
    },
    description: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'OPEN',
      index: true,
    },
    assignedModeratorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
      sparse: true,
    },
    resolutionAction: {
      type: String,
      enum: [...MODERATION_RESOLUTION_ACTIONS, null],
      default: null,
    },
    resolutionNotes: { type: String, default: '', maxlength: 2000 },
    resolvedAt: { type: Date, default: null },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Lightweight auto-mod score at submission time (0–100). */
    autoModScore: { type: Number, default: 0, min: 0, max: 100 },
    autoModFlags: { type: [String], default: [] },
  },
  { timestamps: true },
);

ContentReportSchema.index({ targetType: 1, targetId: 1, reporterId: 1 });
ContentReportSchema.index({ status: 1, createdAt: -1 });
ContentReportSchema.index({ assignedModeratorId: 1, status: 1 });
