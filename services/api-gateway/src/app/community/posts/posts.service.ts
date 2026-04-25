import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/post.dto';
import type { UploadedFile } from '../../../common/interfaces/file.interface';

@Injectable()
export class PostsGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) { }

  // ─── Posts ─────────────────────────────────────────────────────────────────

  createPost(
    createPostDto: CreatePostDto,
    file?: UploadedFile,
    files?: UploadedFile[],
    videos?: UploadedFile[],
    userId?: string,
  ) {
    console.log(
      `[POSTS SERVICE] Sending NATS message for user ${userId}:`,
      createPostDto.content,
    );

    // Convert single file buffer to base64 for NATS serialization
    let processedFile: UploadedFile | undefined = undefined;
    if (file && file.buffer) {
      processedFile = {
        ...file,
        buffer:
          typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64'),
      };
    }

    // Convert multiple files buffers to base64 for NATS serialization
    let processedFiles: UploadedFile[] | undefined = undefined;
    if (files && files.length > 0) {
      processedFiles = files
        .map((file) => {
          if (file && file.buffer) {
            return {
              ...file,
              buffer:
                typeof file.buffer === 'string'
                  ? file.buffer
                  : file.buffer.toString('base64'),
            };
          }
          return file;
        })
        .filter(Boolean);
    }

    // Convert multiple videos buffers to base64 for NATS serialization
    let processedVideos: UploadedFile[] | undefined = undefined;
    if (videos && videos.length > 0) {
      processedVideos = videos
        .map((video) => {
          if (video && video.buffer) {
            return {
              ...video,
              buffer:
                typeof video.buffer === 'string'
                  ? video.buffer
                  : video.buffer.toString('base64'),
            };
          }
          return video;
        })
        .filter(Boolean);
    }

    return this.client.send(
      { cmd: 'app.community.posts.create' },
      {
        userId,
        dto: createPostDto,
        image: processedFile,
        images: processedFiles,
        videos: processedVideos,
      },
    );
  }

  getAllPosts(query: { page?: number; limit?: number }) {
    return this.client.send({ cmd: 'app.community.posts.getAll' }, query);
  }

  getPostsByUser(userId: string, query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.posts.getByUser' },
      { userId, ...query },
    );
  }

  getPostById(postId: string) {
    return this.client.send({ cmd: 'app.community.posts.getById' }, { postId });
  }

  updatePost(
    postId: string,
    updatePostDto: UpdatePostDto,
    file?: UploadedFile,
    files?: UploadedFile[],
    videos?: UploadedFile[],
    userId?: string,
    role?: string,
  ) {
    // Convert single file buffer to base64 for NATS serialization
    let processedFile: UploadedFile | undefined = undefined;
    if (file && file.buffer) {
      processedFile = {
        ...file,
        buffer:
          typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64'),
      };
    }

    // Convert multiple files buffer to base64 for NATS serialization
    let processedFiles: UploadedFile[] | undefined = undefined;
    if (files && files.length > 0) {
      processedFiles = files.map((file) => ({
        ...file,
        buffer: file.buffer
          ? typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64')
          : '',
      }));
    }

    // Convert multiple videos buffer to base64 for NATS serialization
    let processedVideos: UploadedFile[] | undefined = undefined;
    if (videos && videos.length > 0) {
      processedVideos = videos.map((video) => ({
        ...video,
        buffer: video.buffer
          ? typeof video.buffer === 'string'
            ? video.buffer
            : video.buffer.toString('base64')
          : '',
      }));
    }

    return this.client.send(
      { cmd: 'app.community.posts.update' },
      {
        postId,
        userId,
        role,
        dto: updatePostDto,
        image: processedFile,
        images: processedFiles,
        videos: processedVideos,
      },
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

  sharePost(postId: string, userId?: string, comment?: string) {
    return this.client.send(
      { cmd: 'app.community.posts.share' },
      { postId, userId, comment },
    );
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  createComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    file?: UploadedFile,
    userId?: string,
  ) {
    // Convert file buffer to base64 for NATS serialization
    let processedFile: UploadedFile | undefined = undefined;
    if (file && file.buffer) {
      processedFile = {
        ...file,
        buffer:
          typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64'),
      };
    }

    return this.client.send(
      { cmd: 'app.community.comments.create' },
      { postId, userId, dto: createCommentDto, image: processedFile },
    );
  }

  getComments(postId: string, query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.comments.getForPost' },
      { postId, ...query },
    );
  }

  updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    file?: UploadedFile,
    userId?: string,
    role?: string,
  ) {
    // Convert file buffer to base64 for NATS serialization
    let processedFile: UploadedFile | undefined = undefined;
    if (file && file.buffer) {
      processedFile = {
        ...file,
        buffer:
          typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64'),
      };
    }

    return this.client.send(
      { cmd: 'app.community.comments.update' },
      { commentId, userId, role, dto: updateCommentDto, image: processedFile },
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

  // ─── Replies ───────────────────────────────────────────────────────────────

  createReply(
    commentId: string,
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ) {
    return this.client.send(
      { cmd: 'app.community.replies.create' },
      { commentId, postId, userId, dto: createCommentDto },
    );
  }

  createReplyWithFile(
    commentId: string,
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
    file: UploadedFile,
  ) {
    // Convert file buffer to base64 for NATS serialization
    let processedFile: UploadedFile | undefined = undefined;
    if (file && file.buffer) {
      processedFile = {
        ...file,
        buffer:
          typeof file.buffer === 'string'
            ? file.buffer
            : file.buffer.toString('base64'),
      };
    }

    return this.client.send(
      { cmd: 'app.community.replies.createWithFile' },
      { commentId, postId, userId, dto: createCommentDto, image: processedFile },
    );
  }

  getReplies(commentId: string, query: { page?: number; limit?: number }) {
    return this.client.send(
      { cmd: 'app.community.replies.getForComment' },
      { commentId, ...query },
    );
  }
}
