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
import { ArticleDocument } from './schemas/article.schema';

@Controller()
export class ArticlesController {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private readonly articlesService: ArticlesService,
    private readonly s3Service: S3Service,
  ) {}

  // ─── Articles ──────────────────────────────────────────────────────────────

  @MessagePattern({ cmd: 'app.community.articles.create' })
  async createArticle(
    @Payload() data: { dto: CreateArticleDto; image?: Express.Multer.File },
  ) {
    const { dto, image } = data;
    if (!dto) throw new Error('dto is required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(
        image,
        'articles/cover-images',
      );
      dto.coverImage = uploadResult.url;
      dto.coverImageKey = uploadResult.key;
    }

    const article = await this.articlesService.createArticle(dto);
    return { message: 'Article created successfully', data: article };
  }

  @MessagePattern({ cmd: 'app.community.articles.update' })
  async updateArticle(
    @Payload()
    data: {
      id: string;
      dto: UpdateArticleDto;
      image?: Express.Multer.File;
    },
  ) {
    const { id, dto, image } = data;
    if (!id || !dto) throw new Error('id and dto are required');

    if (image) {
      const uploadResult = await this.s3Service.uploadFile(
        image,
        'articles/cover-images',
      );
      (dto as any).coverImage = uploadResult.url;
      (dto as any).coverImageKey = uploadResult.key;
    }

    const article = await this.articlesService.updateArticle(id, dto);
    return { message: 'Article updated successfully', data: article };
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

  @MessagePattern({ cmd: 'app.community.articles.uploadCoverImage' })
  async uploadCoverImage(
    @Payload() data: { id: string; image: Express.Multer.File },
  ) {
    const { id, image } = data;
    if (!id || !image) throw new Error('id and image are required');

    const uploadResult = await this.s3Service.uploadFile(
      image,
      'articles/cover-images',
    );
    const article = await this.articlesService.updateCoverImage(
      id,
      uploadResult.url,
      uploadResult.key,
    );
    return { message: 'Cover image uploaded successfully', data: article };
  }
}
