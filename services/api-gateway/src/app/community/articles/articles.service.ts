import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import type { UploadedFile } from '../../../common/interfaces/file.interface';

@Injectable()
export class ArticlesGatewayService {
  constructor(
    @Inject('NATS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  createArticle(createArticleDto: CreateArticleDto, file?: UploadedFile, userId?: string) {
    return this.client.send(
      { cmd: 'app.community.articles.create' },
      { dto: createArticleDto, image: file, userId },
    );
  }

  getArticles(query: QueryArticlesDto) {
    return this.client.send(
      { cmd: 'app.community.articles.getAll' },
      query,
    );
  }

  getArticleById(id: string) {
    return this.client.send(
      { cmd: 'app.community.articles.getById' },
      { id },
    );
  }

  getArticleBySlug(slug: string) {
    return this.client.send(
      { cmd: 'app.community.articles.getBySlug' },
      { slug },
    );
  }

  updateArticle(id: string, updateArticleDto: UpdateArticleDto, file?: UploadedFile, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.articles.update' },
      { id, dto: updateArticleDto, image: file, userId, role },
    );
  }

  deleteArticle(id: string, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.articles.delete' },
      { id, userId, role },
    );
  }

  
  approveArticle(id: string, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.articles.approve' },
      { id, userId, role },
    );
  }

  uploadCoverImage(id: string, file: UploadedFile, userId?: string, role?: string) {
    return this.client.send(
      { cmd: 'app.community.articles.uploadCoverImage' },
      { id, image: file, userId, role },
    );
  }
}
