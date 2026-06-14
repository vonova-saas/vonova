import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

const TYPE_TO_PREF: Record<string, keyof DefaultPrefs> = {
  GROUP_CHAT: 'groupChat',
  MENTION: 'mentions',
  ENROLLMENT: 'enrollments',
  QUIZ_PUBLISHED: 'quizzes',
  QUIZ_RESULT: 'quizzes',
  LESSON_PUBLISHED: 'lessons',
  SHEET_ASSIGNED: 'lessons',
  COURSE_ANNOUNCEMENT: 'announcements',
  LIKE: 'groupChat',
  COMMENT: 'mentions',
  REPLY: 'mentions',
  REPOST: 'groupChat',
  FOLLOW: 'groupChat',
  MESSAGE: 'groupChat',
};

type DefaultPrefs = {
  groupChat: boolean;
  mentions: boolean;
  enrollments: boolean;
  quizzes: boolean;
  lessons: boolean;
  announcements: boolean;
  marketing: boolean;
};

const DEFAULTS: DefaultPrefs = {
  groupChat: true,
  mentions: true,
  enrollments: true,
  quizzes: true,
  lessons: true,
  announcements: true,
  marketing: false,
};

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectModel('UserNotificationPreferences')
    private readonly prefsModel: Model<Record<string, unknown>>,
  ) {}

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  async getPreferences(userId: string): Promise<DefaultPrefs & { userId: string }> {
    const uid = this.oid(userId);
    let doc: Record<string, unknown> | null = (await this.prefsModel
      .findOne({ userId: uid })
      .lean()) as Record<string, unknown> | null;
    if (!doc) {
      const created = await this.prefsModel.create({ userId: uid, ...DEFAULTS });
      doc = created.toObject() as Record<string, unknown>;
    }
    const row = doc;
    return {
      userId,
      groupChat: row.groupChat !== false,
      mentions: row.mentions !== false,
      enrollments: row.enrollments !== false,
      quizzes: row.quizzes !== false,
      lessons: row.lessons !== false,
      announcements: row.announcements !== false,
      marketing: row.marketing === true,
    };
  }

  async updatePreferences(
    userId: string,
    patch: Partial<DefaultPrefs>,
  ): Promise<DefaultPrefs & { userId: string }> {
    const uid = this.oid(userId);
    const doc = await this.prefsModel.findOneAndUpdate(
      { userId: uid },
      { $set: patch, $setOnInsert: { userId: uid, ...DEFAULTS } },
      { upsert: true, new: true },
    );
    return this.getPreferences(userId);
  }

  async isDeliveryEnabled(userId: string, notificationType: string): Promise<boolean> {
    const key = TYPE_TO_PREF[String(notificationType).toUpperCase()];
    if (!key) return true;
    const prefs = await this.getPreferences(userId);
    return prefs[key] !== false;
  }
}
