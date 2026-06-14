import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from './schemas/posts/comment.schema';
import { CreateCommentDto, UpdateCommentDto } from './dto/post.dto';
import { PostDocument } from './schemas/posts/post.schema';
import { S3Service } from '../../common/aws/s3.service';
import { CommunityS3Service } from '../../common/aws/community-s3.service';
import { AiModerationService } from '../social/ai-moderation.service';
import { sanitizeText } from '../../common/utils/sanitize';
import { BadRequestException } from '@nestjs/common';
import { applyStableUserPublicMedia } from '../../common/media/community-media-hydration.helper';
import { stableMediaGetEnabled } from '../../common/media/stable-media-url';

const COMMENT_AUTHOR_SELECT =
  'name username email profilePictureUrl profilePicture avatar';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
    @Inject(forwardRef(() => AiModerationService))
    private readonly aiModeration: AiModerationService,
  ) { }

  private scheduleCommentModeration(
    commentId: Types.ObjectId | string,
    userId: string,
    text: string,
  ) {
    if (!text?.trim()) return;
    this.aiModeration.enqueue({
      targetType: 'COMMENT',
      targetId: String(commentId),
      userId,
      text,
    });
  }

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    return new Types.ObjectId(id);
  }

  private async hydrateUserPublicMediaLean(
    user: Record<string, unknown> | null | undefined,
  ): Promise<void> {
    if (!user || typeof user !== 'object') return;
    if (stableMediaGetEnabled()) {
      applyStableUserPublicMedia(user);
      return;
    }
    const pic = user.profilePictureUrl ?? user.profilePicture;
    if (typeof pic === 'string') {
      const s = await this.s3Service.signProfileMediaReadUrl(pic);
      if (s) {
        user.profilePictureUrl = s;
        if (typeof user.profilePicture === 'string') {
          user.profilePicture = s;
        }
      }
    }
  }

  private async signCommunityCommentImageUrl(
    url: string | undefined,
  ): Promise<string | undefined> {
    if (!url || typeof url !== 'string') return undefined;
    const key = url.startsWith('http')
      ? this.communityS3Service.extractKeyFromUrl(url)
      : url;
    if (!key?.startsWith('posts/') && !key?.startsWith('articles/')) {
      return undefined;
    }
    try {
      return await this.communityS3Service.getSignedUrl(key, 3600);
    } catch {
      return undefined;
    }
  }

  private async hydrateCommentLean(c: Record<string, unknown>): Promise<void> {
    const author = c.author;
    if (author && typeof author === 'object') {
      await this.hydrateUserPublicMediaLean(author as Record<string, unknown>);
    }
    const image = c.image;
    if (typeof image === 'string') {
      const s = await this.signCommunityCommentImageUrl(image);
      if (s) c.image = s;
    }
    const replies = c.replies;
    if (Array.isArray(replies)) {
      for (const r of replies) {
        if (r && typeof r === 'object') {
          await this.hydrateCommentLean(r as Record<string, unknown>);
        }
      }
    }
  }

  private async populateAndHydrateCommentById(
    id: Types.ObjectId | string,
  ): Promise<Record<string, unknown> | null> {
    const doc = await this.commentModel
      .findById(id)
      .populate('author', COMMENT_AUTHOR_SELECT)
      .lean();
    if (doc) await this.hydrateCommentLean(doc as Record<string, unknown>);
    return doc as Record<string, unknown> | null;
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const safeText = sanitizeText(dto.text, { maxLength: 2000 });
    if (!safeText) {
      throw new BadRequestException('Comment text cannot be empty');
    }
    const comment = await this.commentModel.create({
      post: this.toObjectId(postId),
      author: this.toObjectId(userId),
      text: safeText,
      image: dto.image || null,
      imageKey: dto.imageKey || null,
    });

    this.scheduleCommentModeration(comment._id as Types.ObjectId, userId, safeText);

    const postMeta = await this.postModel
      .findById(this.toObjectId(postId))
      .select('author')
      .lean();

    await this.postModel.findByIdAndUpdate(
      this.toObjectId(postId),
      { $inc: { commentsCount: 1 } },
    );

    const hydrated = await this.populateAndHydrateCommentById(comment._id);
    return {
      comment: hydrated,
      postAuthorId: postMeta?.author ? String(postMeta.author) : null,
      postId,
    };
  }

  async getCommentsByPost(postId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const postObjectId = this.toObjectId(postId);

    const [comments, total] = await Promise.all([
      this.commentModel
        .find({
          post: postObjectId,
          parentComment: null
        }) // Only get top-level comments
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', COMMENT_AUTHOR_SELECT)
        .populate({
          path: 'replies',
          options: { sort: { createdAt: -1 }, limit: 3 }, // Get latest 3 replies
          populate: {
            path: 'author',
            select: COMMENT_AUTHOR_SELECT,
          },
        })
        .lean(),
      this.commentModel.countDocuments({ post: postObjectId, parentComment: null }),
    ]);

    await Promise.all(
      (comments as unknown[]).map((c) =>
        c && typeof c === 'object'
          ? this.hydrateCommentLean(c as Record<string, unknown>)
          : Promise.resolve(),
      ),
    );

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteComment(commentId: string, userId: string, role: string) {
    const comment = await this.commentModel.findById(this.toObjectId(commentId));

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Get the post to check if user is the post author
    const post = await this.postModel.findById(comment.post);
    if (!post) {
      throw new Error('Post not found');
    }

    // Allow deletion if user is: comment author OR post author OR admin
    const isCommentAuthor = comment.author.toString() === userId.toString();
    const isPostAuthor = post.author.toString() === userId.toString();
    const isAdmin = role === 'OWNER';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new Error('You are not allowed to delete this comment');
    }

    // Delete image from S3 if exists
    if (comment.imageKey) {
      try {
        await this.communityS3Service.deleteFile(comment.imageKey);
      } catch (error) {
        console.error('Failed to delete comment image from S3:', error);
        // Continue with comment deletion even if image deletion fails
      }
    }

    // Decrement comments count on the post
    await this.postModel.findByIdAndUpdate(
      comment.post,
      { $inc: { commentsCount: -1 } }
    );

    await this.commentModel.findByIdAndDelete(comment._id);

    return { deleted: true, commentId };
  }

  async getCommentCount(postId: string) {
    return this.commentModel.countDocuments({ post: this.toObjectId(postId) });
  }

  async updateComment(commentId: string, userId: string, role: string, dto: UpdateCommentDto) {
    const comment = await this.commentModel.findById(this.toObjectId(commentId));

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Get the post to check if user is the post author
    const post = await this.postModel.findById(comment.post);
    if (!post) {
      throw new Error('Post not found');
    }

    // Allow update if user is: comment author OR post author OR admin
    const isCommentAuthor = comment.author.toString() === userId.toString();
    const isPostAuthor = post.author.toString() === userId.toString();
    const isAdmin = role === 'OWNER';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new Error('You are not allowed to edit this comment');
    }

    // Handle image replacement
    if (dto.image !== undefined && comment.imageKey) {
      // Delete old image from S3 if new image is provided or image is being removed
      if (dto.image === null || (dto.image && dto.image !== comment.image)) {
        await this.s3Service.deleteFile(comment.imageKey);
      }
    }

    if (dto.text !== undefined) {
      const safe = sanitizeText(dto.text, { maxLength: 2000 });
      if (!safe) {
        throw new BadRequestException('Comment text cannot be empty');
      }
      comment.text = safe;
    }
    if (dto.image !== undefined) comment.image = dto.image || undefined;
    if (dto.imageKey !== undefined) comment.imageKey = dto.imageKey || undefined;

    await comment.save();

    return this.populateAndHydrateCommentById(comment._id);
  }

  // ─── Replies ─────────────────────────────────────────────────────────────────

  async createReply(
    parentCommentId: string,
    postId: string,
    userId: string,
    dto: CreateCommentDto
  ) {
    // Verify parent comment exists
    const parentComment = await this.commentModel.findById(this.toObjectId(parentCommentId));
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    const safeReplyText = sanitizeText(dto.text, { maxLength: 2000 });
    if (!safeReplyText) {
      throw new BadRequestException('Reply text cannot be empty');
    }
    // Create the reply
    const reply = await this.commentModel.create({
      post: this.toObjectId(postId),
      parentComment: this.toObjectId(parentCommentId),
      author: this.toObjectId(userId),
      text: safeReplyText,
      image: dto.image || null,
      imageKey: dto.imageKey || null,
    });

    // Add reply to parent comment's replies array
    await this.commentModel.findByIdAndUpdate(
      this.toObjectId(parentCommentId),
      {
        $push: { replies: reply._id },
        $inc: { repliesCount: 1 }
      }
    );

    // Increment comments count on the post
    await this.postModel.findByIdAndUpdate(
      this.toObjectId(postId),
      { $inc: { commentsCount: 1 } }
    );

    return this.populateAndHydrateCommentById(reply._id);
  }

  async createReplyWithFile(
    parentCommentId: string,
    postId: string,
    userId: string,
    dto: CreateCommentDto,
    file?: Express.Multer.File,
  ) {
    // Verify parent comment exists
    const parentComment = await this.commentModel.findById(this.toObjectId(parentCommentId));
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    let image: string | undefined;
    let imageKey: string | undefined;

    const safeReplyText = sanitizeText(dto.text, { maxLength: 2000 });
    if (!safeReplyText) {
      throw new BadRequestException('Reply text cannot be empty');
    }
    // Create reply first to get replyId
    const reply = await this.commentModel.create({
      post: this.toObjectId(postId),
      parentComment: this.toObjectId(parentCommentId),
      author: this.toObjectId(userId),
      text: safeReplyText,
      image: null,
      imageKey: null,
    });

    // Upload file to S3 if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'posts',
          postId,
          userId,
          reply._id.toString() // Use replyId for the folder structure
        );
        image = uploadResult.url;
        imageKey = uploadResult.key;

        // Update reply with image info
        await this.commentModel.findByIdAndUpdate(reply._id, { image, imageKey });
      } catch (error) {
        // If upload fails, delete the created reply
        await this.commentModel.findByIdAndDelete(reply._id);
        throw new Error(`Failed to upload reply image: ${error.message}`);
      }
    }

    // Add reply to parent comment's replies array
    await this.commentModel.findByIdAndUpdate(
      this.toObjectId(parentCommentId),
      {
        $push: { replies: reply._id },
        $inc: { repliesCount: 1 }
      }
    );

    // Increment comments count on the post
    await this.postModel.findByIdAndUpdate(
      this.toObjectId(postId),
      { $inc: { commentsCount: 1 } }
    );

    return this.populateAndHydrateCommentById(reply._id);
  }

  async getRepliesByComment(
    parentCommentId: string,
    page: number = 1,
    limit: number = 5
  ) {
    const skip = (page - 1) * limit;
    const parentCommentObjectId = this.toObjectId(parentCommentId);

    const [replies, total] = await Promise.all([
      this.commentModel
        .find({ parentComment: parentCommentObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', COMMENT_AUTHOR_SELECT)
        .lean(),
      this.commentModel.countDocuments({ parentComment: parentCommentObjectId }),
    ]);

    await Promise.all(
      (replies as unknown[]).map((r) =>
        r && typeof r === 'object'
          ? this.hydrateCommentLean(r as Record<string, unknown>)
          : Promise.resolve(),
      ),
    );

    return {
      replies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCommentLikesUsers(commentId: string, page = 1, limit = 20) {
    const comment = await this.commentModel
      .findById(this.toObjectId(commentId))
      .select('likes likesCount')
      .lean();
    if (!comment) {
      throw new Error('Comment not found');
    }
    const allIds = ((comment as { likes?: Types.ObjectId[] }).likes ?? []).map((id) =>
      String(id),
    );
    const total = allIds.length;
    const skip = (page - 1) * limit;
    const pageIds = allIds
      .slice(skip, skip + limit)
      .filter((id) => Types.ObjectId.isValid(id));
    if (pageIds.length === 0) {
      const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
      return {
        items: [],
        total,
        page,
        limit,
        totalPages,
      };
    }
    const User = this.postModel.db.model('User');
    const oids = pageIds.map((id) => new Types.ObjectId(id));
    const users = await User.find({ _id: { $in: oids } })
      .select(COMMENT_AUTHOR_SELECT)
      .lean();
    const byId = new Map(
      (users as Record<string, unknown>[]).map((u) => [String(u._id), u]),
    );
    const items = pageIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Record<string, unknown>[];
    await Promise.all(
      items.map((u) => this.hydrateUserPublicMediaLean(u)),
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ─── Likes ─────────────────────────────────────────────────────────────────

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(this.toObjectId(commentId));

    if (!comment) {
      throw new Error('Comment not found');
    }

    const userObjectId = this.toObjectId(userId);
    const alreadyLiked = comment.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      // Unlike
      comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString()) as any;
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Like
      comment.likes.push(userObjectId);
      comment.likesCount += 1;
    }

    await comment.save();

    return {
      liked: !alreadyLiked,
      likesCount: comment.likesCount,
    };
  }

  // Comment CRUD Operations with file upload
  async createCommentWithFile(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
    file?: Express.Multer.File,
  ) {
    let image: string | undefined;
    let imageKey: string | undefined;

    const safeCommentText = sanitizeText(dto.text, { maxLength: 2000 });
    if (!safeCommentText) {
      throw new BadRequestException('Comment text cannot be empty');
    }
    // Create comment first to get commentId
    const comment = await this.commentModel.create({
      post: this.toObjectId(postId),
      author: this.toObjectId(userId),
      text: safeCommentText,
      image: null,
      imageKey: null,
    });

    // Upload file to S3 if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'posts',
          postId,
          userId,
          comment._id.toString() // Use commentId for the folder structure
        );
        image = uploadResult.url;
        imageKey = uploadResult.key;

        // Update comment with image info
        await this.commentModel.findByIdAndUpdate(comment._id, { image, imageKey });
      } catch (error) {
        // If upload fails, delete the created comment
        await this.commentModel.findByIdAndDelete(comment._id);
        throw new Error(`Failed to upload comment image: ${error.message}`);
      }
    }

    const postMeta = await this.postModel
      .findById(this.toObjectId(postId))
      .select('author')
      .lean();

    await this.postModel.findByIdAndUpdate(
      this.toObjectId(postId),
      { $inc: { commentsCount: 1 } },
    );

    this.scheduleCommentModeration(comment._id as Types.ObjectId, userId, safeCommentText);

    const hydrated = await this.populateAndHydrateCommentById(comment._id);
    return {
      comment: hydrated,
      postAuthorId: postMeta?.author ? String(postMeta.author) : null,
      postId,
    };
  }

  async updateCommentWithFile(
    commentId: string,
    userId: string,
    role: string,
    dto: UpdateCommentDto,
    file?: Express.Multer.File,
  ) {
    const comment = await this.commentModel.findById(this.toObjectId(commentId));

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Get the post to check if user is the post author
    const post = await this.postModel.findById(comment.post);
    if (!post) {
      throw new Error('Post not found');
    }

    // Allow update if user is: comment author OR post author OR admin
    const isCommentAuthor = comment.author.toString() === userId.toString();
    const isPostAuthor = post.author.toString() === userId.toString();
    const isAdmin = role === 'OWNER';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new Error('You are not allowed to edit this comment');
    }

    let image: string | undefined;
    let imageKey: string | undefined;
    let oldImageKey = comment.imageKey;

    // Upload new file if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'posts',
          post._id.toString(),
          post.author.toString(), // Use post author's userId
          commentId // Use commentId for the folder structure
        );
        image = uploadResult.url;
        imageKey = uploadResult.key;
      } catch (error) {
        throw new Error(`Failed to upload comment image: ${error.message}`);
      }
    }

    // Update comment data
    if (dto.text !== undefined) {
      const safe = sanitizeText(dto.text, { maxLength: 2000 });
      if (!safe) {
        throw new BadRequestException('Comment text cannot be empty');
      }
      comment.text = safe;
    }
    if (image !== undefined) comment.image = image;
    if (imageKey !== undefined) comment.imageKey = imageKey;

    await comment.save();

    // Delete old image from S3 if a new one was uploaded
    if (oldImageKey && imageKey && oldImageKey !== imageKey) {
      try {
        await this.communityS3Service.deleteFile(oldImageKey);
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to delete old comment image from S3:', error);
      }
    }

    return this.populateAndHydrateCommentById(comment._id);
  }

  // Helper method to get all comments for a post (for deletion purposes)
  async getCommentsByPostForDeletion(postId: string) {
    try {
      console.log(`[COMMENTS SERVICE] Getting comments for post: ${postId}`);
      const comments = await this.commentModel
        .find({ post: this.toObjectId(postId) })
        .lean();
      console.log(`[COMMENTS SERVICE] Found ${comments.length} comments for post: ${postId}`);
      return comments;
    } catch (error) {
      console.error(`[COMMENTS SERVICE] Error getting comments for post: ${postId}`, error);
      return [];
    }
  }

  // Helper method to delete all comments for a post
  async deleteCommentsByPost(postId: string): Promise<{ deletedCount: number; acknowledged: boolean }> {
    try {
      console.log(`[COMMENTS SERVICE] Deleting all comments for post: ${postId}`);
      const result = await this.commentModel.deleteMany({
        post: this.toObjectId(postId)
      });
      console.log(`[COMMENTS SERVICE] Deleted ${result.deletedCount} comments for post: ${postId}`);
      return result;
    } catch (error) {
      console.error(`[COMMENTS SERVICE] Error deleting comments for post: ${postId}`, error);
      return { deletedCount: 0, acknowledged: false };
    }
  }

  // Public method to access comment model directly (for post deletion)
  async deleteCommentsByPostDirect(postId: string): Promise<{ deletedCount: number; acknowledged: boolean }> {
    try {
      console.log(`[COMMENTS SERVICE] Direct deletion of comments for post: ${postId}`);
      const result = await this.commentModel.deleteMany({
        post: this.toObjectId(postId)
      });
      console.log(`[COMMENTS SERVICE] Direct deletion result: ${result.deletedCount} comments deleted`);
      return result;
    } catch (error) {
      console.error(`[COMMENTS SERVICE] Error in direct deletion for post: ${postId}`, error);
      return { deletedCount: 0, acknowledged: false };
    }
  }

  // Public method to get comments directly (for post deletion)
  async getCommentsByPostDirect(postId: string): Promise<any[]> {
    try {
      console.log(`[COMMENTS SERVICE] Direct query for comments of post: ${postId}`);
      const comments = await this.commentModel
        .find({ post: this.toObjectId(postId) })
        .lean();
      console.log(`[COMMENTS SERVICE] Direct query found ${comments.length} comments`);
      return comments;
    } catch (error) {
      console.error(`[COMMENTS SERVICE] Error in direct query for post: ${postId}`, error);
      return [];
    }
  }
}
