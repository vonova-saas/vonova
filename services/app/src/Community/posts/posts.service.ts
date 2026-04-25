import { Injectable } from '@nestjs/common';
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

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
  ) { }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return new Types.ObjectId(id);
  }

  private isOwnerOrAdmin(resourceAuthorId: string, userId: string, role: string): boolean {
    return resourceAuthorId.toString() === userId.toString() || role === Role.INSTRUCTOR_USER;
  }

  // ─── Posts ─────────────────────────────────────────────────────────────────

  async createPost(userId: string, dto: CreatePostDto) {
    try {
      const post = await this.postModel.create({
        author: this.toObjectId(userId),
        content: dto.content,
        tags: dto.tags || [],
        image: dto.image || null,
        imageKey: dto.imageKey || null,
      });

      return this.postModel
        .findById(post._id)
        .populate('author', 'name profilePictureUrl role')
        .lean();
    } catch (error: any) {
      // Handle duplicate key error
      if (error.code === 11000 && error.keyPattern && error.keyPattern['author'] && error.keyPattern['content']) {
        console.log(`[POSTS BACKEND] Duplicate post blocked for user ${userId}: ${dto.content}`);
        throw new BadRequestException('Duplicate post detected. This post already exists.');
      }
      throw error;
    }
  }

  async getAllPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name profilePictureUrl role')
        .populate('sharedPost', 'content author image images imageKeys videos videoKeys createdAt')
        .populate('sharedPost.author', 'name profilePictureUrl role')
        .lean(),
      this.postModel.countDocuments(),
    ]);

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
      .populate('author', 'name profilePictureUrl role')
      .lean();

    if (!post) throw new NotFoundErr('Post not found');

    return post;
  }

  async getPostsByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const authorId = this.toObjectId(userId);

    const [posts, total] = await Promise.all([
      this.postModel
        .find({ author: authorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name profilePictureUrl role')
        .populate('sharedPost', 'content author image images imageKeys videos videoKeys createdAt')
        .populate('sharedPost.author', 'name profilePictureUrl role')
        .lean(),
      this.postModel.countDocuments({ author: authorId }),
    ]);

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

    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tags !== undefined) post.tags = dto.tags || [];
    if (dto.image !== undefined) post.image = dto.image || null;
    if (dto.imageKey !== undefined) post.imageKey = dto.imageKey || null;

    await post.save();

    return this.postModel
      .findById(post._id)
      .populate('author', 'name profilePictureUrl role')
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

    await this.postModel.findByIdAndDelete(post._id);

    return { deleted: true, postId };
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
      tags: [], // Shared posts don't have tags by default
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
      .populate('author', 'name profilePictureUrl role')
      .populate('sharedPost', 'content author image images createdAt')
      .populate('sharedBy', 'name profilePicture role')
      .populate('sharedPost.author', 'name profilePictureUrl role')
      .lean();

    const frontendUrl = process.env.FRONTEND_ORIGIN;
    if (!frontendUrl) {
      throw new NotFoundErr('FRONTEND_ORIGIN is required in .env');
    }

    // Generate shareable link
    const shareableLink = `${frontendUrl}/posts/${postId}`;

    return {
      sharedPost: result,
      originalPostSharesCount: originalPost.sharesCount,
      shareableLink,
    };
  }

  // Post CRUD Operations with file upload
  async createPostWithFile(
    userId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    try {
      let image: string | undefined;
      let imageKey: string | undefined;

      // Create post first to get postId
      const post = await this.postModel.create({
        author: this.toObjectId(userId),
        content: dto.content,
        tags: dto.tags || [],
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
        .populate('author', 'name profilePictureUrl role')
        .lean();
    } catch (error: any) {
      // Handle duplicate key error
      if (error.code === 11000 && error.keyPattern && error.keyPattern['author'] && error.keyPattern['content']) {
        console.log(`[POSTS BACKEND] Duplicate post blocked for user ${userId}: ${dto.content}`);
        throw new BadRequestException('Duplicate post detected. This post already exists.');
      }
      throw error;
    }
  }

  async createPostWithMultipleFiles(
    userId: string,
    dto: CreatePostDto,
    files: Express.Multer.File[],
  ) {
    try {
      // Create post first to get postId
      const post = await this.postModel.create({
        author: this.toObjectId(userId),
        content: dto.content,
        tags: dto.tags || [],
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
        .populate('author', 'name profilePictureUrl role')
        .lean();
    } catch (error: any) {
      // Handle duplicate key error
      if (error.code === 11000 && error.keyPattern && error.keyPattern['author'] && error.keyPattern['content']) {
        console.log(`[POSTS BACKEND] Duplicate post blocked for user ${userId}: ${dto.content}`);
        throw new BadRequestException('Duplicate post detected. This post already exists.');
      }
      throw error;
    }
  }

  async createPostWithVideos(
    userId: string,
    dto: CreatePostDto,
    videos: Express.Multer.File[],
    images?: Express.Multer.File[],
  ) {
    try {
      // Create post first to get postId
      const post = await this.postModel.create({
        author: this.toObjectId(userId),
        content: dto.content,
        tags: dto.tags || [],
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
        .populate('author', 'name profilePictureUrl role')
        .lean();
    } catch (error: any) {
      // Handle duplicate key error
      if (error.code === 11000 && error.keyPattern && error.keyPattern['author'] && error.keyPattern['content']) {
        console.log(`[POSTS BACKEND] Duplicate post blocked for user ${userId}: ${dto.content}`);
        throw new BadRequestException('Duplicate post detected. This post already exists.');
      }
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
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tags !== undefined) post.tags = dto.tags || [];
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
      .populate('author', 'name profilePictureUrl role')
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
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tags !== undefined) post.tags = dto.tags || [];

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
      .populate('author', 'name profilePictureUrl role')
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
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tags !== undefined) post.tags = dto.tags || [];

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
      .populate('author', 'name profilePictureUrl role')
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
