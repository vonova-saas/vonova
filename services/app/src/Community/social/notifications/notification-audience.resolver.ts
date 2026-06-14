import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../../auth/schema/user.schema';
import { CourseEnrollmentAudienceService } from './course-enrollment-audience.service';

export type AudienceSpec =
  | {
      kind: 'courseEnrolled';
      courseId: string;
      excludeUserIds?: string[];
    }
  | {
      kind: 'groupMembers';
      groupId: string;
      excludeUserIds?: string[];
    }
  | { kind: 'users'; userIds: string[] }
  | { kind: 'single'; userId: string };

@Injectable()
export class NotificationAudienceResolver {
  constructor(
    @InjectModel('CommunityGroup') private readonly groupModel: Model<unknown>,
    @InjectModel(User.name) private readonly userModel: Model<unknown>,
    private readonly enrollmentAudience: CourseEnrollmentAudienceService,
  ) {}

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  async resolveUserIds(spec: AudienceSpec): Promise<string[]> {
    const exclude = new Set(
      (spec.kind === 'courseEnrolled' || spec.kind === 'groupMembers'
        ? spec.excludeUserIds
        : [])?.map(String) ?? [],
    );

    if (spec.kind === 'single') {
      const id = String(spec.userId);
      return exclude.has(id) ? [] : [id];
    }

    if (spec.kind === 'users') {
      return [...new Set(spec.userIds.map(String))].filter(
        (id) => id && !exclude.has(id),
      );
    }

    if (spec.kind === 'courseEnrolled') {
      const ids: string[] = [];
      for await (const chunk of this.enrollmentAudience.iterateEnrolledStudentIds(
        spec.courseId,
        200,
      )) {
        for (const id of chunk) {
          if (!exclude.has(id)) ids.push(id);
        }
      }
      return [...new Set(ids)];
    }

    if (spec.kind === 'groupMembers') {
      const g = await this.groupModel
        .findById(this.oid(spec.groupId))
        .select('members')
        .lean();
      const members = (g as { members?: Types.ObjectId[] })?.members ?? [];
      return [...new Set(members.map((m) => String(m)))].filter(
        (id) => id && !exclude.has(id),
      );
    }

    return [];
  }

  /** Resolve @username mentions inside a group to user ids. */
  async resolveMentionedUserIds(
    groupId: string,
    text: string,
    senderId: string,
  ): Promise<string[]> {
    const matches = text.match(/@([a-zA-Z0-9_]{2,40})/g);
    if (!matches?.length) return [];
    const handles = [
      ...new Set(
        matches.map((m) => m.slice(1).toLowerCase()).filter(Boolean),
      ),
    ];
    if (!handles.length) return [];

    const g = await this.groupModel
      .findById(this.oid(groupId))
      .select('members')
      .lean();
    const memberIds = ((g as { members?: Types.ObjectId[] })?.members ?? []).map(
      (m) => this.oid(String(m)),
    );
    if (!memberIds.length) return [];

    const users = await this.userModel
      .find({
        _id: { $in: memberIds },
        username: { $in: handles },
      })
      .select('_id username')
      .lean();

    return users
      .map((u) => String((u as { _id: Types.ObjectId })._id))
      .filter((id) => id && id !== senderId);
  }
}
