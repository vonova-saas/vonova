import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, UpdateCommentDto } from './dto/post.dto';
import type { UploadedFile } from '../../../common/interfaces/file.interface';

@Injectable()
export class PostsGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  // ─── Posts ─────────────────────────────────────────────────────────────────

  createPost(createPostDto: CreatePostDto, file?: UploadedFile, userId?: string) {
    console.log(`[POSTS SERVICE] Sending NATS message for user ${userId}:`, createPostDto.content);
    return this.client.send(
      { cmd: 'app.community.posts.create' },
      { userId, dto: createPostDto, image: file },
    );
  }

  getAllPosts(query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.posts.getAll' },
      query,
    );
  }

  getPostsByUser(userId: string, query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.posts.getByUser' },
      { userId, ...query },
    );
  }

  getPostById(postId: string) {
    return this.client.send(
      { cmd: 'app.community.posts.getById' },
      { postId },
    );
  }

  updatePost(postId: string, updatePostDto: UpdatePostDto, file?: UploadedFile, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.posts.update' },
      { postId, userId, role, dto: updatePostDto, image: file },
    );
  }

  deletePost(postId: string, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.posts.delete' },
      { postId, userId, role },
    );
  }

  toggleLike(postId: string, userId?: string) {
    return this.client.send(
      { cmd: 'app.community.posts.toggleLike' },
      { postId, userId },
    );
  }

  sharePost(postId: string) {
    return this.client.send(
      { cmd: 'app.community.posts.share' },
      { postId },
    );
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  createComment(postId: string, createCommentDto: CreateCommentDto, file?: UploadedFile, userId?: string) {
    return this.client.send(
      { cmd: 'app.community.comments.create' },
      { postId, userId, dto: createCommentDto, image: file },
    );
  }

  getComments(postId: string, query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.comments.getForPost' },
      { postId, ...query },
    );
  }

  updateComment(commentId: string, updateCommentDto: UpdateCommentDto, file?: UploadedFile, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.comments.update' },
      { commentId, userId, role, dto: updateCommentDto, image: file },
    );
  }

  deleteComment(commentId: string, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.comments.delete' },
      { commentId, userId, role },
    );
  }

  toggleCommentLike(commentId: string, userId?: string) {
    return this.client.send(
      { cmd: 'app.community.comments.toggleLike' },
      { commentId, userId },
    );
  }
}
