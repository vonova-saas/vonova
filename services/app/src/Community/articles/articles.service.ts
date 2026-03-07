import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArticleDocument, IArticle } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { PaginationUtil, PaginationResult } from './utils/pagination.util';
import { S3Service } from '../../common/aws/s3.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private readonly s3Service: S3Service,
  ) { }

  // Article CRUD Operations
  async createArticle(createArticleDto: CreateArticleDto): Promise<IArticle> {
    // Set default author ID
    const articleData = {
      ...createArticleDto,
      author: '507f1f77bcf86cd799439013' // Default author ID
    };

    // Check if slug already exists
    if (articleData.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: articleData.slug
      });
      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    const article = new this.articleModel(articleData);
    return article.save();
  }

  async updateArticle(id: string, updateArticleDto: UpdateArticleDto): Promise<IArticle> {
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }



    // Check slug uniqueness if provided
    if (updateArticleDto.slug && updateArticleDto.slug !== article.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: updateArticleDto.slug,
        _id: { $ne: id }
      });
      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    Object.assign(article, updateArticleDto);
    return article.save();
  }

  async deleteArticle(id: string): Promise<any> {
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Delete cover image from S3 if it exists
    if (article.coverImageKey) {
      try {
        await this.s3Service.deleteFile(article.coverImageKey);
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete cover image from S3:', error);
      }
    }

    // Delete the article
    await this.articleModel.findByIdAndDelete(id);
    
    return { message: 'Article deleted successfully' }
  }

  async getArticleBySlug(slug: string): Promise<IArticle> {
    const article = await this.articleModel
      .findOne({ slug })
      .populate('author', 'name email avatar')
      .exec();

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async getArticleById(id: string): Promise<IArticle> {
    const article = await this.articleModel
      .findById(id)
      .populate('author', 'name email avatar')
      .exec();

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async getArticles(query: QueryArticlesDto): Promise<PaginationResult<IArticle>> {
    const paginationOptions = PaginationUtil.createPaginationOptions(
      query.page,
      query.limit
    );
    const skip = PaginationUtil.getSkipValue(paginationOptions);

    // Build filter
    const filter: any = {};

    if (query.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      const validCategories = ['architecture', 'devops', 'backend', 'databases', 'frontend', 'mobile', 'ai', 'security'];
      const filteredCategories = categories.filter(cat => validCategories.includes(cat));
      
      if (filteredCategories.length > 0) {
        filter.category = { $in: filteredCategories };
      }
    }

    if (query.author) {
      filter.author = new Types.ObjectId(query.author);
    }

    if (query.publishedStatus) {
      filter.publishedStatus = query.publishedStatus;
    }


    // Date range filter
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) {
        filter.createdAt.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.createdAt.$lte = new Date(query.dateTo);
      }
    }

    // Search filter
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Build sort
    const sort: any = {};
    sort[query.sortBy || 'createdAt'] = query.sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(paginationOptions.limit)
        .exec(),
      this.articleModel.countDocuments(filter)
    ]);

    return PaginationUtil.createPaginationResult(articles, total, paginationOptions);
  }

  async updatePublishedStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<IArticle> {
    const article = await this.articleModel.findByIdAndUpdate(
      id,
      { publishedStatus: status },
      { new: true }
    );

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async updateCoverImage(id: string, coverImage: string, coverImageKey: string): Promise<IArticle> {
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // If article already has a cover image, delete the old one from S3
    if (article.coverImageKey && article.coverImageKey !== coverImageKey) {
      try {
        await this.s3Service.deleteFile(article.coverImageKey);
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to delete old cover image from S3:', error);
      }
    }

    article.coverImage = coverImage;
    article.coverImageKey = coverImageKey;
    
    return article.save();
  }
}
