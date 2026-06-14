import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotFoundException as NotFoundErr,
  ForbiddenException as ForbiddenErr,
  BadRequestException,
} from '@nestjs/common';
import { PostDocument } from './schemas/posts/post.schema';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { Role } from '../../auth/enums/role.enum';
import { CommentsService } from './comments.service';
import { S3Service } from '../../common/aws/s3.service';
import { CommunityS3Service } from '../../common/aws/community-s3.service';
import { AiModerationService } from '../social/ai-moderation.service';
import { AutoModerationService } from '../social/auto-moderation.service';
import { sanitizeText } from '../../common/utils/sanitize';
import {
  assertNotRapidPostDuplicate,
  fingerprintIncomingMedia,
} from './post-duplicate.util';
import {
  applyStablePostMedia,
  applyStableUserPublicMedia,
} from '../../common/media/community-media-hydration.helper';
import { stableMediaGetEnabled } from '../../common/media/stable-media-url';

const POST_AUTHOR_PUBLIC =
  'name email profilePictureUrl username headline bio role followersCount followingCount isVerifiedInstructor coverImageUrl';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
    @Inject(forwardRef(() => AiModerationService))
    private readonly aiModeration: AiModerationService,
    @Inject(forwardRef(() => AutoModerationService))
    private readonly autoMod: AutoModerationService,
  ) { }

  /**
   * Hook AI moderation into post-creation paths without blocking the request.
   * Synchronous evaluation is cheap (regex heuristics), but we still enqueue
   * the heavier persist + state-mutation path on the in-process queue.
   */
  protected scheduleModeration(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    userId: string,
    text: string,
  ) {
    if (!text?.trim()) return;
    this.aiModeration.enqueue({ targetType, targetId, userId, text });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
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
    const pic = user.profilePictureUrl;
    if (typeof pic === 'string') {
      const s = await this.s3Service.signProfileMediaReadUrl(pic);
      if (s) user.profilePictureUrl = s;
    }
    const cover = user.coverImageUrl;
    if (typeof cover === 'string') {
      const s = await this.s3Service.signProfileMediaReadUrl(cover);
      if (s) user.coverImageUrl = s;
    }
  }

  private async signCommunityPostReadUrl(
    url: string | null | undefined,
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

  private async hydratePostLeanForClient(
    post: Record<string, unknown> | null | undefined,
  ): Promise<void> {
    if (!post || typeof post !== 'object') return;
    if (stableMediaGetEnabled()) {
      applyStablePostMedia(post);
      return;
    }
    const img = post.image;
    if (typeof img === 'string') {
      const s = await this.signCommunityPostReadUrl(img);
      if (s) post.image = s;
    }
    if (Array.isArray(post.images)) {
      post.images = await Promise.all(
        (post.images as unknown[]).map(async (u) =>
          typeof u === 'string' ? (await this.signCommunityPostReadUrl(u)) ?? u : u,
        ),
      );
    }
    if (Array.isArray(post.videos)) {
      post.videos = await Promise.all(
        (post.videos as unknown[]).map(async (u) =>
          typeof u === 'string' ? (await this.signCommunityPostReadUrl(u)) ?? u : u,
        ),
      );
    }
    const att = post.attachmentsMeta;
    if (Array.isArray(att)) {
      for (const a of att) {
        if (!a || typeof a !== 'object') continue;
        const o = a as Record<string, unknown>;
        const url = o.url;
        if (typeof url === 'string') {
          const s = await this.signCommunityPostReadUrl(url);
          if (s) o.url = s;
        }
      }
    }
    await this.hydrateUserPublicMediaLean(post.author as Record<string, unknown>);
    const sharedBy = post.sharedBy;
    if (sharedBy && typeof sharedBy === 'object' && !Array.isArray(sharedBy)) {
      await this.hydrateUserPublicMediaLean(sharedBy as Record<string, unknown>);
    }
    const sp = post.sharedPost;
    if (sp && typeof sp === 'object' && !Array.isArray(sp)) {
      await this.hydratePostLeanForClient(sp as Record<string, unknown>);
    }
  }

  private isOwnerOrAdmin(resourceAuthorId: string, userId: string, role: string): boolean {
    return resourceAuthorId.toString() === userId.toString() || role === Role.INSTRUCTOR_USER;
  }

  private normalizeHashtags(tags?: string[]): string[] {
    if (!tags?.length) return [];
    const out = tags
      .map((t) =>
        String(t)
          .replace(/^#/, '')
          .toLowerCase()
          .trim(),
      )
      .filter(Boolean);
    return [...new Set(out)];
  }

  private socialCreateFields(userId: string, dto: CreatePostDto) {
    const safeContent = sanitizeText(dto.content, { maxLength: 5000 });
    if (!safeContent) {
      throw new BadRequestException('Post content cannot be empty');
    }
    return {
      author: this.toObjectId(userId),
      content: safeContent,
      tags: dto.tags || [],
      hashtags: this.normalizeHashtags(dto.hashtags),
      visibility: dto.visibility ?? 'PUBLIC',
      courseId:
        dto.courseId && String(dto.courseId).trim()
          ? this.toObjectId(dto.courseId)
          : null,
      isPinned: dto.isPinned ?? false,
      instructorOnly: dto.instructorOnly ?? false,
    };
  }

  /** Short-window duplicate + burst rate limit (does not replace monthly credits). */
  private async enforceAntiSpamBeforeCreate(
    userId: string,
    dto: CreatePostDto,
    opts?: { uploadParts?: string[] },
  ): Promise<void> {
    const authorOid = this.toObjectId(userId);
    const burst = await this.postModel.countDocuments({
      author: authorOid,
      createdAt: { $gte: new Date(Date.now() - 5000) },
      isDeleted: { $ne: true },
    });
    if (burst >= 25) {
      throw new BadRequestException(
        'You are posting too quickly. Please wait a few seconds and try again.',
      );
    }

    const safeContent = sanitizeText(dto.content, { maxLength: 5000 });
    if (!safeContent) return;

    const incomingMediaFingerprint = fingerprintIncomingMedia({
      imageKey: dto.imageKey,
      uploadParts: opts?.uploadParts,
    });

    await assertNotRapidPostDuplicate(this.postModel, {
      authorId: userId,
      content: safeContent,
      incomingMediaFingerprint,
      contextKey: '',
    });

    const auto = this.autoMod.evaluateText(safeContent, {
      userId,
      surface: 'post',
    });
    if (auto.shouldBlock) {
      throw new BadRequestException(
        'Content could not be posted. Please revise and try again.',
      );
    }
  }

  private applySocialUpdateFields(post: PostDocument, dto: UpdatePostDto) {
    if (dto.content !== undefined) {
      const safe = sanitizeText(dto.content, { maxLength: 5000 });
      if (!safe) {
        throw new BadRequestException('Post content cannot be empty');
      }
      post.content = safe;
    }
    if (dto.hashtags !== undefined) {
      post.hashtags = this.normalizeHashtags(dto.hashtags);
    }
    if (dto.visibility !== undefined) post.visibility = dto.visibility;
    if (dto.courseId !== undefined) {
      post.courseId =
        dto.courseId && String(dto.courseId).trim()
          ? this.toObjectId(dto.courseId)
          : null;
    }
    if (dto.isPinned !== undefined) post.isPinned = dto.isPinned;
    if (dto.instructorOnly !== undefined) post.instructorOnly = dto.instructorOnly;
  }

  // ─── Posts ─────────────────────────────────────────────────────────────────

  async createPost(userId: string, dto: CreatePostDto) {
    await this.enforceAntiSpamBeforeCreate(userId, dto);

    const post = await this.postModel.create({
      ...this.socialCreateFields(userId, dto),
      image: dto.image || null,
      imageKey: dto.imageKey || null,
    });

    this.scheduleModeration('POST', String(post._id), userId, dto.content ?? '');

    const created = await this.postModel
      .findById(post._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();
    await this.hydratePostLeanForClient(created as Record<string, unknown>);
    return created;
  }

  async getAllPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', POST_AUTHOR_PUBLIC)
        .populate('sharedPost', 'content author image images imageKeys videos videoKeys createdAt')
        .populate('sharedPost.author', POST_AUTHOR_PUBLIC)
        .lean(),
      this.postModel.countDocuments(),
    ]);

    await Promise.all(
      (posts as Record<string, unknown>[]).map((p) =>
        this.hydratePostLeanForClient(p),
      ),
    );

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(postId: string) {
    const post = await this.postModel
      .findById(this.toObjectId(postId))
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();

    if (!post) throw new NotFoundErr('Post not found');

    await this.hydratePostLeanForClient(post as Record<string, unknown>);
    return post;
  }

  async getPostsByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const authorId = this.toObjectId(userId);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({
          author: authorId,
          $or: [{ groupId: null }, { groupId: { $exists: false } }],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', POST_AUTHOR_PUBLIC)
        .populate('sharedPost', 'content author image images imageKeys videos videoKeys createdAt')
        .populate('sharedPost.author', POST_AUTHOR_PUBLIC)
        .lean(),
      this.postModel.countDocuments({
        author: authorId,
        $or: [{ groupId: null }, { groupId: { $exists: false } }],
      }),
    ]);

    await Promise.all(
      (posts as Record<string, unknown>[]).map((p) =>
        this.hydratePostLeanForClient(p),
      ),
    );

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePost(postId: string, userId: string, role: string, dto: UpdatePostDto) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to edit this post');
    }

    // Handle image replacement
    if (dto.image !== undefined && post.imageKey) {
      // Delete old image from S3 if new image is provided or image is being removed
      if (dto.image === null || (dto.image && dto.image !== post.image)) {
        await this.s3Service.deleteFile(post.imageKey);
      }
    }

    // content normalisation now lives inside applySocialUpdateFields
    if (dto.tags !== undefined) post.tags = dto.tags || [];
    this.applySocialUpdateFields(post, dto);
    if (dto.image !== undefined) post.image = dto.image || null;
    if (dto.imageKey !== undefined) post.imageKey = dto.imageKey || null;

    await post.save();

    return this.postModel
      .findById(post._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();
  }

  async deletePost(postId: string, userId: string, role: string) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to delete this post');
    }

    // Delete images and videos from S3 if they exist
    const deletePromises: Promise<boolean>[] = [];

    // Delete single image if exists
    if (post.imageKey) {
      deletePromises.push(this.communityS3Service.deleteFile(post.imageKey));
    }

    // Delete multiple images if they exist
    if (post.imageKeys && Array.isArray(post.imageKeys)) {
      for (const imageKey of post.imageKeys) {
        deletePromises.push(this.communityS3Service.deleteFile(imageKey));
      }
    }

    // Delete single video if exists
    if (post.videoKey) {
      deletePromises.push(this.communityS3Service.deleteFile(post.videoKey));
    }

    // Delete multiple videos if they exist
    if (post.videoKeys && Array.isArray(post.videoKeys)) {
      for (const videoKey of post.videoKeys) {
        deletePromises.push(this.communityS3Service.deleteFile(videoKey));
      }
    }

    // Wait for all S3 deletions to complete
    if (deletePromises.length > 0) {
      try {
        await Promise.allSettled(deletePromises);
      } catch (error) {
        console.error('Failed to delete some images from S3:', error);
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete all comments associated with this post and their images
    await this.deletePostCommentsAndImages(post._id.toString());

    let originalPostId: string | null = null;
    let originalPostSharesCount: number | null = null;

    if (post.sharedPost) {
      const original = await this.postModel.findById(post.sharedPost);
      if (original) {
        original.sharesCount = Math.max(0, (original.sharesCount ?? 0) - 1);
        await original.save();
        originalPostId = original._id.toString();
        originalPostSharesCount = original.sharesCount;
      }
    }

    await this.postModel.findByIdAndDelete(post._id);

    return {
      deleted: true,
      postId: post._id.toString(),
      isRepost: Boolean(post.sharedPost),
      originalPostId,
      originalPostSharesCount,
    };
  }

  // Test method to verify comment deletion (can be removed after testing)
  async testCommentDeletion(postId: string) {
    console.log(`[POSTS BACKEND] Testing comment deletion for post: ${postId}`);

    // Check existing comments
    const existingComments = await this.commentsService.getCommentsByPostForDeletion(postId);
    console.log(`[POSTS BACKEND] Existing comments: ${existingComments?.length || 0}`);

    if (existingComments && existingComments.length > 0) {
      // Test deletion
      const result = await this.commentsService.deleteCommentsByPost(postId);
      console.log(`[POSTS BACKEND] Test deletion result:`, result);

      // Verify deletion
      const remainingComments = await this.commentsService.getCommentsByPostForDeletion(postId);
      console.log(`[POSTS BACKEND] Remaining comments after deletion: ${remainingComments?.length || 0}`);
    }

    return { testCompleted: true };
  }

  // Helper method to delete all comments and their images for a post
  private async deletePostCommentsAndImages(postId: string) {
    try {
      console.log(`[POSTS BACKEND] Starting comment deletion for post: ${postId}`);

      // First, directly query the comment model to ensure we get all comments
      const postObjectId = this.toObjectId(postId);
      const comments = await this.commentsService.getCommentsByPostForDeletion(postId);

      // Fallback: if service method fails, try direct model access
      if (!comments) {
        console.log(`[POSTS BACKEND] Service method returned null, trying direct model access`);
        const directComments = await this.commentsService.getCommentsByPostDirect(postId);
        console.log(`[POSTS BACKEND] Direct query found ${directComments?.length || 0} comments`);

        if (directComments && directComments.length > 0) {
          // Delete images from S3 for all comments
          const deletePromises: Promise<boolean>[] = [];

          for (const comment of directComments) {
            // Delete comment image if exists
            if (comment.imageKey) {
              console.log(`[POSTS BACKEND] Deleting comment image: ${comment.imageKey}`);
              deletePromises.push(this.communityS3Service.deleteFile(comment.imageKey));
            }
          }

          // Wait for all S3 deletions to complete
          if (deletePromises.length > 0) {
            try {
              await Promise.allSettled(deletePromises);
              console.log(`[POSTS BACKEND] S3 image deletions completed`);
            } catch (error) {
              console.error('Failed to delete some comment images from S3:', error);
            }
          }

          // Delete all comments from database
          console.log(`[POSTS BACKEND] Deleting ${directComments.length} comments from database`);
          const deleteResult = await this.commentsService.deleteCommentsByPostDirect(postId);
          console.log(`[POSTS BACKEND] Comments deletion result:`, deleteResult);
        }
      } else {
        console.log(`[POSTS BACKEND] Found ${comments?.length || 0} comments for post: ${postId}`);

        if (comments && comments.length > 0) {
          // Delete images from S3 for all comments
          const deletePromises: Promise<boolean>[] = [];

          for (const comment of comments) {
            // Delete comment image if exists
            if (comment.imageKey) {
              console.log(`[POSTS BACKEND] Deleting comment image: ${comment.imageKey}`);
              deletePromises.push(this.communityS3Service.deleteFile(comment.imageKey));
            }
          }

          // Wait for all S3 deletions to complete
          if (deletePromises.length > 0) {
            try {
              await Promise.allSettled(deletePromises);
              console.log(`[POSTS BACKEND] S3 image deletions completed`);
            } catch (error) {
              console.error('Failed to delete some comment images from S3:', error);
            }
          }

          // Delete all comments from database
          console.log(`[POSTS BACKEND] Deleting ${comments.length} comments from database`);
          const deleteResult = await this.commentsService.deleteCommentsByPost(postId);
          console.log(`[POSTS BACKEND] Comments deletion result:`, deleteResult);
        } else {
          console.log(`[POSTS BACKEND] No comments found for post: ${postId}`);
        }
      }
    } catch (error) {
      console.error('Failed to delete comments for post:', postId, error);
      // Continue with post deletion even if comment deletion fails
    }
  }

  // ─── Likes ─────────────────────────────────────────────────────────────────

  async toggleLike(postId: string, userId: string) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    const userObjectId = this.toObjectId(userId);
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString()) as any;
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes.push(userObjectId);
      post.likesCount += 1;
    }

    await post.save();

    return {
      liked: !alreadyLiked,
      likesCount: post.likesCount,
      authorId: String(post.author),
      postId: String(post._id),
    };
  }

  async getPostLikesUsers(postId: string, page = 1, limit = 20) {
    const post = await this.postModel
      .findById(this.toObjectId(postId))
      .select('likes likesCount')
      .lean();
    if (!post) throw new NotFoundErr('Post not found');
    const allIds = ((post as { likes?: Types.ObjectId[] }).likes ?? []).map((id) =>
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
      .select(POST_AUTHOR_PUBLIC)
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

  // ─── Shares ─────────────────────────────────────────────────────────────────

  async sharePost(postId: string, userId: string, shareComment?: string) {
    const originalPost = await this.postModel.findById(this.toObjectId(postId));

    if (!originalPost) throw new NotFoundErr('Post not found');

    // Increment shares count on original post
    originalPost.sharesCount++;
    await originalPost.save();

    // Create a new post as a shared post
    const sharedPostContent = shareComment || '';

    const newSharedPost = await this.postModel.create({
      author: this.toObjectId(userId),
      content: sharedPostContent,
      tags: [],
      hashtags: [],
      visibility: (originalPost as PostDocument).visibility || 'PUBLIC',
      courseId: null,
      isPinned: false,
      instructorOnly: false,
      sharedPost: this.toObjectId(postId),
      sharedBy: this.toObjectId(userId),
      shareComment: shareComment || null,
      image: null,
      imageKey: null,
      images: null,
      imageKeys: null,
    });

    // Return the newly created shared post with full population
    const result = await this.postModel
      .findById(newSharedPost._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .populate('sharedPost', 'content author image images createdAt')
      .populate('sharedBy', 'name profilePicture profilePictureUrl role')
      .populate('sharedPost.author', POST_AUTHOR_PUBLIC)
      .lean();

    await this.hydratePostLeanForClient(result as Record<string, unknown>);

    const frontendUrl =
      process.env.FRONTEND_ORIGIN?.trim() ||
      process.env.COMMUNITY_APP_ORIGIN?.trim() ||
      'http://localhost:3000';

    // Generate shareable link
    const shareableLink = `${frontendUrl.replace(/\/+$/, '')}/community/explore`;

    return {
      sharedPost: result,
      originalPostSharesCount: originalPost.sharesCount,
      originalAuthorId: String(originalPost.author),
      originalPostId: String(originalPost._id),
      shareableLink,
    };
  }

  // Post CRUD Operations with file upload
  async createPostWithFile(
    userId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    const uploadParts = file
      ? [`${file.originalname}|${file.size}|${file.mimetype || ''}`]
      : undefined;
    await this.enforceAntiSpamBeforeCreate(userId, dto, { uploadParts });

    let image: string | undefined;
    let imageKey: string | undefined;

    try {
      // Create post first to get postId
      const post = await this.postModel.create({
        ...this.socialCreateFields(userId, dto),
        image: null,
        imageKey: null,
      });

      // Upload file to S3 if provided
      if (file) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'posts',
            post._id.toString(),
            userId
          );
          image = uploadResult.url;
          imageKey = uploadResult.key;

          // Update post with image info
          await this.postModel.findByIdAndUpdate(post._id, { image, imageKey });
        } catch (error) {
          // If upload fails, delete the created post
          await this.postModel.findByIdAndDelete(post._id);
          throw new BadRequestException(`Failed to upload post image: ${error.message}`);
        }
      }

      return this.postModel
        .findById(post._id)
        .populate('author', POST_AUTHOR_PUBLIC)
        .lean();
    } catch (error: any) {
      throw error;
    }
  }

  async createPostWithMultipleFiles(
    userId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    const uploadParts = files.map(
      (f) => `${f.originalname}|${f.size}|${f.mimetype || ''}`,
    );
    await this.enforceAntiSpamBeforeCreate(userId, dto, { uploadParts });

    try {
      // Create post first to get postId
      const post = await this.postModel.create({
        ...this.socialCreateFields(userId, dto),
        images: null,
        imageKeys: null,
      });

      const uploadedImages: string[] = [];
      const uploadedImageKeys: string[] = [];

      // Upload all files to S3
      for (const file of files) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'posts',
            post._id.toString(),
            userId
          );
          uploadedImages.push(uploadResult.url);
          uploadedImageKeys.push(uploadResult.key);
        } catch (error) {
          // If any upload fails, clean up uploaded files and delete the post
          for (const key of uploadedImageKeys) {
            try {
              await this.communityS3Service.deleteFile(key);
            } catch (cleanupError) {
              console.error('Failed to cleanup uploaded file:', cleanupError);
            }
          }
          await this.postModel.findByIdAndDelete(post._id);
          throw new BadRequestException(`Failed to upload post image: ${error.message}`);
        }
      }

      // Update post with images info
      await this.postModel.findByIdAndUpdate(post._id, {
        images: uploadedImages,
        imageKeys: uploadedImageKeys
      });

      return this.postModel
        .findById(post._id)
        .populate('author', POST_AUTHOR_PUBLIC)
        .lean();
    } catch (error: any) {
      throw error;
    }
  }

  async createPostWithVideos(
    userId: string,
    dto: CreatePostDto,
    videos: Express.Multer.File[],
    images?: Express.Multer.File[],
  ) {
    const uploadParts = [
      ...(images ?? []).map(
        (f) => `${f.originalname}|${f.size}|${f.mimetype || ''}`,
      ),
      ...videos.map(
        (f) => `${f.originalname}|${f.size}|${f.mimetype || ''}`,
      ),
    ];
    await this.enforceAntiSpamBeforeCreate(userId, dto, { uploadParts });

    try {
      // Create post first to get postId
      const post = await this.postModel.create({
        ...this.socialCreateFields(userId, dto),
        images: null,
        imageKeys: null,
        videos: null,
        videoKeys: null,
      });

      const uploadedImages: string[] = [];
      const uploadedImageKeys: string[] = [];
      const uploadedVideos: string[] = [];
      const uploadedVideoKeys: string[] = [];

      // Upload images to S3 if provided
      if (images && images.length > 0) {
        for (const file of images) {
          try {
            const uploadResult = await this.communityS3Service.uploadFile(
              file,
              'posts',
              post._id.toString(),
              userId
            );
            uploadedImages.push(uploadResult.url);
            uploadedImageKeys.push(uploadResult.key);
          } catch (error) {
            // Clean up on failure
            await this.cleanupUploads(uploadedImageKeys, uploadedVideoKeys, post._id.toString());
            throw new BadRequestException(`Failed to upload post image: ${error.message}`);
          }
        }
      }

      // Upload videos to S3
      for (const video of videos) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            video,
            'posts',
            post._id.toString(),
            userId
          );
          uploadedVideos.push(uploadResult.url);
          uploadedVideoKeys.push(uploadResult.key);
        } catch (error) {
          // Clean up on failure
          await this.cleanupUploads(uploadedImageKeys, uploadedVideoKeys, post._id.toString());
          throw new BadRequestException(`Failed to upload post video: ${error.message}`);
        }
      }

      // Update post with files info
      await this.postModel.findByIdAndUpdate(post._id, {
        images: uploadedImages.length > 0 ? uploadedImages : null,
        imageKeys: uploadedImageKeys.length > 0 ? uploadedImageKeys : null,
        videos: uploadedVideos.length > 0 ? uploadedVideos : null,
        videoKeys: uploadedVideoKeys.length > 0 ? uploadedVideoKeys : null,
      });

      return this.postModel
        .findById(post._id)
        .populate('author', POST_AUTHOR_PUBLIC)
        .lean();
    } catch (error: any) {
      throw error;
    }
  }

  private async cleanupUploads(imageKeys: string[], videoKeys: string[], postId: string) {
    // Clean up uploaded images
    for (const key of imageKeys) {
      try {
        await this.communityS3Service.deleteFile(key);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image:', cleanupError);
      }
    }

    // Clean up uploaded videos
    for (const key of videoKeys) {
      try {
        await this.communityS3Service.deleteFile(key);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded video:', cleanupError);
      }
    }

    // Delete the post
    try {
      await this.postModel.findByIdAndDelete(postId);
    } catch (deleteError) {
      console.error('Failed to delete post during cleanup:', deleteError);
    }
  }

  async updatePostWithFile(
    postId: string,
    userId: string,
    role: string,
    dto: UpdatePostDto,
    file?: Express.Multer.File,
  ) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to edit this post');
    }

    let image: string | undefined;
    let imageKey: string | undefined;
    let oldImageKey = post.imageKey;

    // Upload new file if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'posts',
          postId,
          userId
        );
        image = uploadResult.url;
        imageKey = uploadResult.key;
      } catch (error) {
        throw new BadRequestException(`Failed to upload post image: ${error.message}`);
      }
    }

    // Update post data
    // content normalisation now lives inside applySocialUpdateFields
    if (dto.tags !== undefined) post.tags = dto.tags || [];
    this.applySocialUpdateFields(post, dto);
    if (image !== undefined) post.image = image;
    if (imageKey !== undefined) post.imageKey = imageKey;

    await post.save();

    // Delete old image from S3 if a new one was uploaded
    if (oldImageKey && imageKey && oldImageKey !== imageKey) {
      try {
        await this.communityS3Service.deleteFile(oldImageKey);
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to delete old post image from S3:', error);
      }
    }

    return this.postModel
      .findById(post._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();
  }

  async updatePostWithMultipleFiles(
    postId: string,
    userId: string,
    role: string,
    dto: UpdatePostDto,
    files?: Express.Multer.File[],
  ) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to edit this post');
    }

    let uploadedImages: string[] = [];
    let uploadedImageKeys: string[] = [];
    const oldImageKeys = post.imageKeys || [];

    // Upload new files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'posts',
            postId,
            userId
          );
          uploadedImages.push(uploadResult.url);
          uploadedImageKeys.push(uploadResult.key);
        } catch (error) {
          // If any upload fails, clean up uploaded files
          for (const key of uploadedImageKeys) {
            try {
              await this.communityS3Service.deleteFile(key);
            } catch (cleanupError) {
              console.error('Failed to cleanup uploaded file:', cleanupError);
            }
          }
          throw new BadRequestException(`Failed to upload post image: ${error.message}`);
        }
      }
    }

    // Update post data
    // content normalisation now lives inside applySocialUpdateFields
    if (dto.tags !== undefined) post.tags = dto.tags || [];
    this.applySocialUpdateFields(post, dto);

    // Replace images if new ones were uploaded
    if (uploadedImages.length > 0) {
      post.images = uploadedImages;
      post.imageKeys = uploadedImageKeys;
    }

    await post.save();

    // Delete old images from S3 if new ones were uploaded
    if (oldImageKeys.length > 0 && uploadedImageKeys.length > 0) {
      const deletePromises = oldImageKeys.map(key =>
        this.communityS3Service.deleteFile(key).catch(error =>
          console.error('Failed to delete old image from S3:', error)
        )
      );
      await Promise.allSettled(deletePromises);
    }

    return this.postModel
      .findById(post._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();
  }

  async updatePostWithVideos(
    postId: string,
    userId: string,
    role: string,
    dto: UpdatePostDto,
    videos: Express.Multer.File[],
    images?: Express.Multer.File[],
  ) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to edit this post');
    }

    let uploadedImages: string[] = [];
    let uploadedImageKeys: string[] = [];
    let uploadedVideos: string[] = [];
    let uploadedVideoKeys: string[] = [];

    const oldImageKeys = post.imageKeys || [];
    const oldVideoKeys = post.videoKeys || [];

    // Upload new images if provided
    if (images && images.length > 0) {
      for (const file of images) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'posts',
            postId,
            userId
          );
          uploadedImages.push(uploadResult.url);
          uploadedImageKeys.push(uploadResult.key);
        } catch (error) {
          // Clean up uploaded files on failure
          await this.cleanupUpdateUploads(uploadedImageKeys, uploadedVideoKeys);
          throw new BadRequestException(`Failed to upload post image: ${error.message}`);
        }
      }
    }

    // Upload new videos if provided
    if (videos && videos.length > 0) {
      for (const video of videos) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            video,
            'posts',
            postId,
            userId
          );
          uploadedVideos.push(uploadResult.url);
          uploadedVideoKeys.push(uploadResult.key);
        } catch (error) {
          // Clean up uploaded files on failure
          await this.cleanupUpdateUploads(uploadedImageKeys, uploadedVideoKeys);
          throw new BadRequestException(`Failed to upload post video: ${error.message}`);
        }
      }
    }

    // Update post data
    // content normalisation now lives inside applySocialUpdateFields
    if (dto.tags !== undefined) post.tags = dto.tags || [];
    this.applySocialUpdateFields(post, dto);

    // Replace images if new ones were uploaded
    if (uploadedImages.length > 0) {
      post.images = uploadedImages;
      post.imageKeys = uploadedImageKeys;
    }

    // Replace videos if new ones were uploaded
    if (uploadedVideos.length > 0) {
      post.videos = uploadedVideos;
      post.videoKeys = uploadedVideoKeys;
    }

    await post.save();

    // Delete old files from S3 if new ones were uploaded
    if (oldImageKeys.length > 0 && uploadedImageKeys.length > 0) {
      const deletePromises = oldImageKeys.map(key =>
        this.communityS3Service.deleteFile(key).catch(error =>
          console.error('Failed to delete old image from S3:', error)
        )
      );
      await Promise.allSettled(deletePromises);
    }

    if (oldVideoKeys.length > 0 && uploadedVideoKeys.length > 0) {
      const deletePromises = oldVideoKeys.map(key =>
        this.communityS3Service.deleteFile(key).catch(error =>
          console.error('Failed to delete old video from S3:', error)
        )
      );
      await Promise.allSettled(deletePromises);
    }

    return this.postModel
      .findById(post._id)
      .populate('author', POST_AUTHOR_PUBLIC)
      .lean();
  }

  private async cleanupUpdateUploads(imageKeys: string[], videoKeys: string[]) {
    // Clean up uploaded images
    for (const key of imageKeys) {
      try {
        await this.communityS3Service.deleteFile(key);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded image during update:', cleanupError);
      }
    }

    // Clean up uploaded videos
    for (const key of videoKeys) {
      try {
        await this.communityS3Service.deleteFile(key);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded video during update:', cleanupError);
      }
    }
  }
}
