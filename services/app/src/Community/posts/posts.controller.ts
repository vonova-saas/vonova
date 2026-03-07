import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostsService } from './posts.service';
import { CommentsService } from './comments.service';
import {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/post.dto';
import { S3Service } from '../../common/aws/s3.service';

@Controller()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly s3Service: S3Service,
  ) {}

  // ─── Posts ─────────────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.posts.create' })
  async createPost(
    @Payload()
    data: {
      userId: string;
      dto: CreatePostDto;
      image?: Express.Multer.File;
    },
  ) {
    const { userId, dto, image } = data;
    if (!userId || !dto) throw new Error('userId and dto are required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(image, 'posts');
      dto.image = uploadResult.url;
      dto.imageKey = uploadResult.key;
    }

    const post = await this.postsService.createPost(userId, dto);
    return { message: 'Post created successfully', data: { post } };
  }

  @MessagePattern({ cmd: 'app.community.posts.getAll' })
  async getAllPosts(@Payload() data: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = data || {};
    const result = await this.postsService.getAllPosts(page, limit);
    return { message: 'Posts fetched successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.posts.getByUser' })
  async getPostsByUser(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    const { userId, page = 1, limit = 10 } = data;
    if (!userId) throw new Error('userId is required');

    const result = await this.postsService.getPostsByUser(userId, page, limit);
    return { message: 'User posts fetched successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.posts.getById' })
  async getPostById(@Payload() data: { postId: string }) {
    const { postId } = data;
    if (!postId) throw new Error('postId is required');

    const post = await this.postsService.getPostById(postId);
    return { message: 'Post fetched successfully', data: { post } };
  }

  @MessagePattern({ cmd: 'app.community.posts.update' })
  async updatePost(
    @Payload()
    data: {
      postId: string;
      userId: string;
      role: string;
      dto: UpdatePostDto;
      image?: Express.Multer.File;
    },
  ) {
    const { postId, userId, role, dto, image } = data;
    if (!postId || !userId || !role || !dto)
      throw new Error('postId, userId, role and dto are required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(image, 'posts');
      dto.image = uploadResult.url;
      dto.imageKey = uploadResult.key;
    }

    const post = await this.postsService.updatePost(postId, userId, role, dto);
    return { message: 'Post updated successfully', data: { post } };
  }

  @MessagePattern({ cmd: 'app.community.posts.delete' })
  async deletePost(
    @Payload() data: { postId: string; userId: string; role: string },
  ) {
    const { postId, userId, role } = data;
    if (!postId || !userId || !role)
      throw new Error('postId, userId and role are required');

    const result = await this.postsService.deletePost(postId, userId, role);
    return { message: 'Post deleted successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.posts.toggleLike' })
  async toggleLike(@Payload() data: { postId: string; userId: string }) {
    const { postId, userId } = data;
    if (!postId || !userId) throw new Error('postId and userId are required');

    const result = await this.postsService.toggleLike(postId, userId);
    return {
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: result,
    };
  }

  @MessagePattern({ cmd: 'app.community.posts.share' })
  async sharePost(@Payload() data: { postId: string }) {
    const { postId } = data;
    if (!postId) throw new Error('postId is required');

    const result = await this.postsService.sharePost(postId);
    return { message: 'Post shared successfully', data: result };
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.comments.create' })
  async addComment(
    @Payload()
    data: {
      postId: string;
      userId: string;
      dto: CreateCommentDto;
      image?: Express.Multer.File;
    },
  ) {
    const { postId, userId, dto, image } = data;
    if (!postId || !userId || !dto)
      throw new Error('postId, userId and dto are required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(image, 'comments');
      dto.image = uploadResult.url;
      dto.imageKey = uploadResult.key;
    }

    const result = await this.commentsService.createComment(
      postId,
      userId,
      dto,
    );
    return { message: 'Comment added successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.comments.getForPost' })
  async getComments(
    @Payload() data: { postId: string; page?: number; limit?: number },
  ) {
    const { postId, page = 1, limit = 10 } = data;
    if (!postId) throw new Error('postId is required');

    const result = await this.commentsService.getCommentsByPost(
      postId,
      page,
      limit,
    );
    return { data: result };
  }

  @MessagePattern({ cmd: 'app.community.comments.update' })
  async updateComment(
    @Payload()
    data: {
      commentId: string;
      userId: string;
      role: string;
      dto: UpdateCommentDto;
      image?: Express.Multer.File;
    },
  ) {
    const { commentId, userId, role, dto, image } = data;
    if (!commentId || !userId || !role || !dto)
      throw new Error('commentId, userId, role and dto are required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(image, 'comments');
      dto.image = uploadResult.url;
      dto.imageKey = uploadResult.key;
    }

    const result = await this.commentsService.updateComment(
      commentId,
      userId,
      role,
      dto,
    );
    return { message: 'Comment updated successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.comments.delete' })
  async deleteComment(
    @Payload() data: { commentId: string; userId: string; role: string },
  ) {
    const { commentId, userId, role } = data;
    if (!commentId || !userId || !role)
      throw new Error('commentId, userId and role are required');

    const result = await this.commentsService.deleteComment(
      commentId,
      userId,
      role,
    );
    return { message: 'Comment deleted successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.comments.toggleLike' })
  async toggleCommentLike(
    @Payload() data: { commentId: string; userId: string },
  ) {
    const { commentId, userId } = data;
    if (!commentId || !userId)
      throw new Error('commentId and userId are required');

    const result = await this.commentsService.toggleCommentLike(
      commentId,
      userId,
    );
    return {
      message: result.liked ? 'Comment liked' : 'Comment unliked',
      data: result,
    };
  }
}
