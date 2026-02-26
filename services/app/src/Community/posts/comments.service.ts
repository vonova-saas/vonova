import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from './schemas/posts/comment.schema';
import { CreateCommentDto, UpdateCommentDto } from './dto/post.dto';
import { PostDocument } from './schemas/posts/post.schema';
import { S3Service } from '../../common/aws/s3.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel('Post') private readonly postModel: Model<PostDocument>,
    private readonly s3Service: S3Service,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    return new Types.ObjectId(id);
  }

  async createComment(postId: string, userId: string, dto: CreateCommentDto) {
    const comment = await this.commentModel.create({
      post: this.toObjectId(postId),
      author: this.toObjectId(userId),
      text: dto.text,
      image: dto.image || null,
      imageKey: dto.imageKey || null,
    });

    // Increment comments count on the post
    await this.postModel.findByIdAndUpdate(
      this.toObjectId(postId),
      { $inc: { commentsCount: 1 } }
    );

    return this.commentModel
      .findById(comment._id)
      .populate('author', 'name profilePicture')
      .lean();
  }

  async getCommentsByPost(postId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const postObjectId = this.toObjectId(postId);

    const [comments, total] = await Promise.all([
      this.commentModel
        .find({ post: postObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name profilePicture')
        .lean(),
      this.commentModel.countDocuments({ post: postObjectId }),
    ]);

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
        await this.s3Service.deleteFile(comment.imageKey);
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

    if (dto.text !== undefined) comment.text = dto.text;
    if (dto.image !== undefined) comment.image = dto.image || undefined;
    if (dto.imageKey !== undefined) comment.imageKey = dto.imageKey || undefined;

    await comment.save();

    return this.commentModel
      .findById(comment._id)
      .populate('author', 'name profilePicture')
      .lean();
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
}
