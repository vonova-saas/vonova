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

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly s3Service: S3Service,
  ) {}

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
    const post = await this.postModel.create({
      author: this.toObjectId(userId),
      content: dto.content,
      image: dto.image || null,
      imageKey: dto.imageKey || null,
    });

    return this.postModel
      .findById(post._id)
      .populate('author', 'name profilePicture role')
      .lean();
  }

  async getAllPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name profilePicture role')
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
      .populate('author', 'name profilePicture role')
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
        .populate('author', 'name profilePicture role')
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
    if (dto.image !== undefined) post.image = dto.image || null;
    if (dto.imageKey !== undefined) post.imageKey = dto.imageKey || null;

    await post.save();

    return this.postModel
      .findById(post._id)
      .populate('author', 'name profilePicture role')
      .lean();
  }

  async deletePost(postId: string, userId: string, role: string) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    if (!this.isOwnerOrAdmin(post.author.toString(), userId, role)) {
      throw new ForbiddenErr('You are not allowed to delete this post');
    }

    // Delete image from S3 if exists
    if (post.imageKey) {
      try {
        await this.s3Service.deleteFile(post.imageKey);
      } catch (error) {
        console.error('Failed to delete image from S3:', error);
        // Continue with post deletion even if image deletion fails
      }
    }

    await this.postModel.findByIdAndDelete(post._id);

    return { deleted: true, postId };
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

  async sharePost(postId: string) {
    const post = await this.postModel.findById(this.toObjectId(postId));

    if (!post) throw new NotFoundErr('Post not found');

    // Increment shares count
    post.sharesCount++;
    await post.save();

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new NotFoundErr('FRONTEND_URL is required in .env');
    }

    // Generate shareable link
    const shareableLink = `${frontendUrl}/posts/${postId}`;

    return {
      shareableLink,
      sharesCount: post.sharesCount,
    };
  }
}
