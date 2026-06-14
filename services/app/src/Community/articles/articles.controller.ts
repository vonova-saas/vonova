/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { S3Service } from '../../common/aws/s3.service';
import { CommunityS3Service } from '../../common/aws/community-s3.service';
import { ArticleDocument } from './schemas/article.schema';

@Controller()
export class ArticlesController {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private readonly articlesService: ArticlesService,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
  ) {}

  // ─── Articles ──────────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.articles.create' })
  async createArticle(
    @Payload() data: { dto: CreateArticleDto; image?: Express.Multer.File; images?: Express.Multer.File[]; userId?: string },
  ) {
    const { dto, image, images, userId } = data;
    if (!dto) throw new Error('dto is required');

    const gallery =
      images && images.length > 0
        ? images.filter(
            (f) =>
              f &&
              (typeof f.buffer === 'string' ||
                (f.buffer && typeof f.buffer === 'object')),
          )
        : [];

    if (gallery.length > 1) {
      const article = await this.articlesService.createArticleWithMultipleFiles(
        dto,
        gallery,
        userId,
      );
      return { message: 'Article created successfully', data: article };
    }

    const single = image ?? (gallery.length === 1 ? gallery[0] : undefined);
    const article = await this.articlesService.createArticleWithFile(
      dto,
      single,
      userId,
    );
    return { message: 'Article created successfully', data: article };
  }

  @MessagePattern({ cmd: 'app.community.articles.update' })
  async updateArticle(
    @Payload()
    data: {
      id: string;
      dto: UpdateArticleDto;
      image?: Express.Multer.File;
      images?: Express.Multer.File[];
      userId?: string;
      role?: string;
    },
  ) {
    const { id, dto, image, images, userId, role } = data;
    if (!id || !dto) throw new Error('id and dto are required');

    // Handle both single image and multiple images
    if (images && images.length > 0) {
      const article = await this.articlesService.updateArticleWithMultipleFiles(id, dto, images, userId, role);
      return { message: 'Article updated successfully', data: article };
    } else {
      const article = await this.articlesService.updateArticleWithFile(id, dto, image, userId, role);
      return { message: 'Article updated successfully', data: article };
    }
  }

  @MessagePattern({ cmd: 'app.community.articles.delete' })
  async deleteArticle(@Payload() data: { id: string }) {
    const { id } = data;
    if (!id) throw new Error('id is required');

    const result = await this.articlesService.deleteArticle(id);
    return { message: 'Article deleted successfully', data: result };
  }

  @MessagePattern({ cmd: 'app.community.articles.getBySlug' })
  async getArticleBySlug(@Payload() data: { slug: string }) {
    const { slug } = data;
    if (!slug) throw new Error('slug is required');

    const article = await this.articlesService.getArticleBySlug(slug);
    return { message: 'Article retrieved successfully', data: article };
  }

  @MessagePattern({ cmd: 'app.community.articles.getById' })
  async getArticleById(@Payload() data: { id: string }) {
    const { id } = data;
    if (!id) throw new Error('id is required');

    const article = await this.articlesService.getArticleById(id);
    return { message: 'Article retrieved successfully', data: article };
  }

  @MessagePattern({ cmd: 'app.community.articles.getAll' })
  async getArticles(@Payload() data: QueryArticlesDto) {
    const result = await this.articlesService.getArticles(data || {});
    return { message: 'Articles retrieved successfully', ...result };
  }

  
  @MessagePattern({ cmd: 'app.community.articles.approve' })
  async approveArticle(@Payload() data: { id: string }) {
    const { id } = data;
    if (!id) throw new Error('id is required');

    const article = await this.articlesService.updatePublishedStatus(
      id,
      'published',
    );
    return { message: 'Article approved successfully', data: article };
  }

  }
