import { Schema } from 'mongoose';

/**
 * CommunityGroup
 *
 * A group is a focused social space (interest group, course community, etc.).
 *
 * When `isCourseGroup` is true, the group is linked to an LMS course via
 * `courseId`. The course instructor becomes the OWNER, and group membership
 * is controlled by enrollment (auto-join on enroll, auto-leave on unenroll).
 *
 * Role precedence in code: OWNER > ADMIN > MODERATOR > INSTRUCTOR > MEMBER.
 */
export const GROUP_ROLES = [
  'OWNER',
  'ADMIN',
  'MODERATOR',
  'INSTRUCTOR',
  'MEMBER',
] as const;

export const CommunityGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    avatarUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    admins: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    moderators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC',
      index: true,
    },

    /**
     * Course-linked spaces use COURSE_PRIVATE: not discoverable as public feed
     * content; membership follows LMS enrollment + instructor ownership.
     */
    coursePrivacyMode: {
      type: String,
      enum: ['NONE', 'COURSE_PRIVATE'],
      default: 'NONE',
      index: true,
    },

    isCourseGroup: { type: Boolean, default: false, index: true },
    courseId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
      sparse: true,
    },
    /**
     * When `isCourseGroup` is true, this is the course instructor (same as
     * `ownerId` in normal cases). Kept separate so co-instructors / TAs can
     * be promoted later without changing ownership.
     */
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
      sparse: true,
    },

    membersCount: { type: Number, default: 0, min: 0 },
    postsCount: { type: Number, default: 0, min: 0 },

    /** Soft-delete (e.g. LMS course removed); hidden from lists and access APIs. */
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /** Moderation state — banned users cannot rejoin or read private groups. */
    bannedMembers: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    /** Muted users keep read access but cannot post / react. */
    mutedMembers: {
      type: [
        new Schema(
          {
            userId: {
              type: Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            until: { type: Date, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    /** Per-user last read timestamp for group chat unread counts. */
    chatReadAtByUser: {
      type: Map,
      of: Date,
      default: {},
    },
    /** Per-user opt-out of GROUP_CHAT push notifications (mentions still delivered). */
    chatNotificationMutedByUser: {
      type: Map,
      of: Boolean,
      default: {},
    },
    /** When set, only moderators+ can send chat messages. */
    chatLockedUntil: { type: Date, default: null, index: true, sparse: true },
    /** When true, only OWNER/ADMIN/INSTRUCTOR/MODERATOR can create posts. */
    postingDisabled: { type: Boolean, default: false, index: true },
    /** Pinned group chat messages (instructor/moderator). */
    pinnedChatMessages: {
      type: [
        new Schema(
          {
            messageId: {
              type: Schema.Types.ObjectId,
              ref: 'GroupMessage',
              required: true,
            },
            pinnedBy: {
              type: Schema.Types.ObjectId,
              ref: 'User',
              required: true,
            },
            pinnedAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

CommunityGroupSchema.index({ name: 'text', description: 'text' });
// Exactly one community group per course.
CommunityGroupSchema.index(
  { courseId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { isCourseGroup: true },
    name: 'unique_course_group',
  },
);
