import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ArticleDocument, IArticle } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { PaginationUtil, PaginationResult } from './utils/pagination.util';
import { S3Service } from '../../common/aws/s3.service';
import { CommunityS3Service } from '../../common/aws/community-s3.service';
import { sanitizeText } from '../../common/utils/sanitize';
import { ContentBlockType } from './interfaces/content-block.interface';
import { applyStableArticleMedia } from '../../common/media/community-media-hydration.helper';
import { stableMediaGetEnabled } from '../../common/media/stable-media-url';

/**
 * Apply text-level sanitization to article DTO fields. The article body
 * itself is allowed to contain rich Markdown / HTML — rendering of that
 * field happens client-side through `sanitizeHtml`. Here we strip tags only
 * from the surface-text fields (title, description, tags) that should never
 * contain markup.
 */
function applyArticleSanitization<
  T extends {
    title?: string;
    description?: string;
    tags?: string[];
  },
>(dto: T): T {
  if (dto.title !== undefined) {
    dto.title = sanitizeText(dto.title, { maxLength: 200 });
  }
  if (dto.description !== undefined) {
    dto.description = sanitizeText(dto.description, { maxLength: 500 });
  }
  if (Array.isArray(dto.tags)) {
    dto.tags = dto.tags
      .map((t) => sanitizeText(t, { maxLength: 40 }))
      .filter(Boolean)
      .slice(0, 20);
  }
  return dto;
}

/** Same rules as `ArticleSchema` pre-save slug generation. */
function slugFromTitleOrRaw(title: string, explicitSlug?: string): string {
  const source = (explicitSlug?.trim() || title).trim();
  const s = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'article';
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
  ) {}

  private async signArticleCommunityReadUrl(
    urlOrKey: string | null | undefined,
  ): Promise<string | undefined> {
    if (!urlOrKey || typeof urlOrKey !== 'string') return undefined;
    const key = urlOrKey.startsWith('http')
      ? this.communityS3Service.extractKeyFromUrl(urlOrKey)
      : urlOrKey;
    if (
      !key ||
      (!key.startsWith('articles/') && !key.startsWith('posts/'))
    ) {
      return undefined;
    }
    try {
      return await this.communityS3Service.getSignedUrl(key, 3600);
    } catch {
      return undefined;
    }
  }

  private async hydrateArticleReadUrls(
    article: Record<string, unknown>,
  ): Promise<void> {
    if (stableMediaGetEnabled()) {
      applyStableArticleMedia(article);
      return;
    }
    const au = article.author;
    if (au && typeof au === 'object') {
      const a = au as Record<string, unknown>;
      const pic = a.profilePictureUrl ?? a.avatar;
      if (typeof pic === 'string') {
        const signed = await this.s3Service.signProfileMediaReadUrl(pic);
        if (signed) {
          a.profilePictureUrl = signed;
          if (typeof a.avatar === 'string') a.avatar = signed;
        }
      }
    }

    if (
      article.coverImageKey &&
      typeof article.coverImageKey === 'string'
    ) {
      const signed = await this.signArticleCommunityReadUrl(
        article.coverImageKey,
      );
      if (signed) article.coverImage = signed;
    } else if (article.coverImage && typeof article.coverImage === 'string') {
      const signed = await this.signArticleCommunityReadUrl(
        article.coverImage,
      );
      if (signed) article.coverImage = signed;
    }

    const blocks = article.contentBlocks;
    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (!block || typeof block !== 'object') continue;
        const b = block as Record<string, unknown>;
        if (b.type !== ContentBlockType.IMAGE && b.type !== 'image') continue;
        if (typeof b.imageKey === 'string' && b.imageKey) {
          const signed = await this.signArticleCommunityReadUrl(b.imageKey);
          if (signed) b.url = signed;
        } else if (typeof b.url === 'string') {
          const signed = await this.signArticleCommunityReadUrl(b.url);
          if (signed) b.url = signed;
        }
      }
    }

    if (Array.isArray(article.images)) {
      article.images = await Promise.all(
        (article.images as string[]).map(async (u) => {
          if (typeof u !== 'string') return u;
          return (await this.signArticleCommunityReadUrl(u)) ?? u;
        }),
      );
    }
  }

  /**
   * Reserves a slug that does not exist yet. Pre-assign before `create`/`save`
   * so title-derived slugs never hit Mongo duplicate key (E11000) when omitted from the DTO.
   */
  private async allocateUniqueSlug(base: string): Promise<string> {
    const root = base.slice(0, 180);
    let slug = root;
    let counter = 2;
    while (await this.articleModel.exists({ slug })) {
      slug = `${root}-${counter}`.slice(0, 200);
      counter += 1;
      if (counter > 10_000) {
        const fallback = `${root}-${new Types.ObjectId().toString().slice(-8)}`.slice(
          0,
          200,
        );
        if (!(await this.articleModel.exists({ slug: fallback }))) {
          return fallback;
        }
        throw new BadRequestException('Could not allocate a unique article slug');
      }
    }
    return slug;
  }

  /** Insert with one retry if another writer wins the same slug (E11000). */
  private async insertArticleDocument(
    articleData: Record<string, unknown>,
  ): Promise<ArticleDocument> {
    try {
      return await this.articleModel.create(articleData);
    } catch (err: unknown) {
      const mongo = err as {
        code?: number;
        keyPattern?: Record<string, unknown>;
      };
      if (mongo?.code === 11000 && mongo.keyPattern && 'slug' in mongo.keyPattern) {
        const base = String(articleData.slug ?? 'article');
        articleData.slug = await this.allocateUniqueSlug(
          `${base}-x-${new Types.ObjectId().toString().slice(-8)}`,
        );
        return await this.articleModel.create(articleData);
      }
      throw err;
    }
  }

  // Article CRUD Operations
  async createArticle(createArticleDto: CreateArticleDto): Promise<IArticle> {
    applyArticleSanitization(createArticleDto);
    if (!createArticleDto.title) {
      throw new BadRequestException('Article title cannot be empty');
    }
    const uniqueSlug = await this.allocateUniqueSlug(
      slugFromTitleOrRaw(createArticleDto.title, createArticleDto.slug),
    );
    // Set default author ID
    const articleData = {
      ...createArticleDto,
      description: (createArticleDto.description ?? '').trim(),
      slug: uniqueSlug,
      author: '507f1f77bcf86cd799439013', // Default author ID
    };

    const article = new this.articleModel(articleData);
    return article.save();
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<IArticle> {
    applyArticleSanitization(updateArticleDto);
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check slug uniqueness if provided
    if (updateArticleDto.slug && updateArticleDto.slug !== article.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: updateArticleDto.slug,
        _id: { $ne: id },
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

    // Delete images from S3 if they exist
    const deletePromises: Promise<boolean>[] = [];
    
    // Delete cover image if exists
    if (article.coverImageKey) {
      deletePromises.push(this.communityS3Service.deleteFile(article.coverImageKey));
    }
    
    // Delete multiple images if they exist
    if (article.imageKeys && Array.isArray(article.imageKeys)) {
      for (const imageKey of article.imageKeys) {
        deletePromises.push(this.communityS3Service.deleteFile(imageKey));
      }
    }
    
    // Wait for all S3 deletions to complete
    if (deletePromises.length > 0) {
      try {
        await Promise.allSettled(deletePromises);
      } catch (error) {
        console.error('Failed to delete some images from S3:', error);
        // Continue with article deletion even if image deletion fails
      }
    }

    // Delete the article
    await this.articleModel.findByIdAndDelete(id);

    return { message: 'Article deleted successfully' };
  }

  async getArticleBySlug(slug: string): Promise<IArticle> {
    const article = await this.articleModel
      .findOne({ slug })
      .populate(
        'author',
        'name email avatar profilePictureUrl username headline',
      )
      .lean()
      .exec();

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.hydrateArticleReadUrls(article as Record<string, unknown>);
    return article as IArticle;
  }

  async getArticleById(id: string): Promise<IArticle> {
    const article = await this.articleModel
      .findById(id)
      .populate(
        'author',
        'name email avatar profilePictureUrl username headline',
      )
      .lean()
      .exec();

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.hydrateArticleReadUrls(article as Record<string, unknown>);
    return article as IArticle;
  }

  async getArticles(
    query: QueryArticlesDto,
  ): Promise<PaginationResult<IArticle>> {
    const paginationOptions = PaginationUtil.createPaginationOptions(
      query.page,
      query.limit,
    );
    const skip = PaginationUtil.getSkipValue(paginationOptions);

    // Build filter
    const filter: any = {};

    if (query.category) {
      const categories = Array.isArray(query.category)
        ? query.category
        : [query.category];
      const validCategories = [
        'architecture',
        'devops',
        'backend',
        'nestjs',
        'databases',
        'frontend',
        'mobile',
        'ai',
        'security',
        'typescript',
        'javascript',
        'nodejs',
        'webdev',
        'api',
        'microservices',
      ];
      const filteredCategories = categories.filter((cat) =>
        validCategories.includes(cat),
      );

      if (filteredCategories.length > 0) {
        filter.category = { $in: filteredCategories };
      }
    }

    if (query.author) {
      filter.author = new Types.ObjectId(query.author);
    }

    if (query.publishedStatus) {
      filter.publishedStatus = query.publishedStatus;
    } else if (query.status) {
      filter.publishedStatus = query.status;
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
        .populate(
        'author',
        'name email avatar profilePictureUrl username headline',
      )
        .sort(sort)
        .skip(skip)
        .limit(paginationOptions.limit)
        .lean()
        .exec(),
      this.articleModel.countDocuments(filter),
    ]);

    await Promise.all(
      (articles as Record<string, unknown>[]).map((a) =>
        this.hydrateArticleReadUrls(a),
      ),
    );

    return PaginationUtil.createPaginationResult(
      articles,
      total,
      paginationOptions,
    );
  }

  async updatePublishedStatus(
    id: string,
    status: 'draft' | 'published' | 'archived',
  ): Promise<IArticle> {
    const article = await this.articleModel.findByIdAndUpdate(
      id,
      { publishedStatus: status },
      { new: true },
    );

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async updateCoverImage(
    id: string,
    coverImage: string,
    coverImageKey: string,
  ): Promise<IArticle> {
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // If article already has a cover image, delete the old one from S3
    if (article.coverImageKey && article.coverImageKey !== coverImageKey) {
      try {
        await this.communityS3Service.deleteFile(article.coverImageKey);
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to delete old cover image from S3:', error);
      }
    }

    article.coverImage = coverImage;
    article.coverImageKey = coverImageKey;

    return article.save();
  }

  // Article CRUD Operations with file upload
  async createArticleWithFile(
    createArticleDto: CreateArticleDto,
    file?: Express.Multer.File,
    userId?: string,
  ): Promise<IArticle> {
    applyArticleSanitization(createArticleDto);
    if (!createArticleDto.title) {
      throw new BadRequestException('Article title cannot be empty');
    }
    let coverImage: string | undefined;
    let coverImageKey: string | undefined;
    const finalUserId = userId || '507f1f77bcf86cd799439013'; // Default author ID

    const uniqueSlug = await this.allocateUniqueSlug(
      slugFromTitleOrRaw(createArticleDto.title, createArticleDto.slug),
    );

    // Create article first to get articleId
    const articleData = {
      ...createArticleDto,
      description: (createArticleDto.description ?? '').trim(),
      slug: uniqueSlug,
      author: finalUserId,
      coverImage: null,
      coverImageKey: null,
    };

    const article = await this.insertArticleDocument(articleData);

    // Upload file to S3 if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'articles',
          article._id.toString(),
          finalUserId
        );
        coverImage = uploadResult.url;
        coverImageKey = uploadResult.key;
        
        // Update article with image info
        await this.articleModel.findByIdAndUpdate(article._id, { coverImage, coverImageKey });
      } catch (error) {
        // If upload fails, delete the created article
        await this.articleModel.findByIdAndDelete(article._id);
        throw new BadRequestException(`Failed to upload cover image: ${error.message}`);
      }
    }

    const result = await this.articleModel
      .findById(article._id)
      .populate(
        'author',
        'name email avatar profilePictureUrl username headline',
      )
      .lean();
    
    if (!result) {
      throw new Error('Failed to retrieve created article');
    }
    
    return result;
  }

  async createArticleWithMultipleFiles(
    createArticleDto: CreateArticleDto,
    files?: Express.Multer.File[],
    userId?: string,
  ): Promise<IArticle> {
    applyArticleSanitization(createArticleDto);
    if (!createArticleDto.title) {
      throw new BadRequestException('Article title cannot be empty');
    }
    let uploadedImages: string[] = [];
    let uploadedImageKeys: string[] = [];
    const finalUserId = userId || '507f1f77bcf86cd799439013'; // Default author ID

    const uniqueSlug = await this.allocateUniqueSlug(
      slugFromTitleOrRaw(createArticleDto.title, createArticleDto.slug),
    );

    // Create article first to get articleId
    const articleData = {
      ...createArticleDto,
      description: (createArticleDto.description ?? '').trim(),
      slug: uniqueSlug,
      author: finalUserId,
      coverImage: null,
      coverImageKey: null,
      images: null,
      imageKeys: null,
    };

    const article = await this.insertArticleDocument(articleData);

    // Upload files to S3 if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'articles',
            article._id.toString(),
            finalUserId
          );
          uploadedImages.push(uploadResult.url);
          uploadedImageKeys.push(uploadResult.key);
        } catch (error) {
          // If any upload fails, clean up uploaded files and delete the article
          for (const key of uploadedImageKeys) {
            try {
              await this.communityS3Service.deleteFile(key);
            } catch (cleanupError) {
              console.error('Failed to cleanup uploaded file:', cleanupError);
            }
          }
          await this.articleModel.findByIdAndDelete(article._id);
          throw new BadRequestException(`Failed to upload article image: ${error.message}`);
        }
      }
    }

    // Update article with images info if any were uploaded
    if (uploadedImages.length > 0) {
      await this.articleModel.findByIdAndUpdate(article._id, { 
        images: uploadedImages, 
        imageKeys: uploadedImageKeys 
      });
    }

    const result = await this.articleModel
      .findById(article._id)
      .populate(
        'author',
        'name email avatar profilePictureUrl username headline',
      )
      .lean();
    
    if (!result) {
      throw new Error('Failed to retrieve created article');
    }
    
    return result;
  }

  async updateArticleWithFile(
    id: string,
    updateArticleDto: UpdateArticleDto,
    file?: Express.Multer.File,
    userId?: string,
    role?: string,
  ): Promise<IArticle> {
    applyArticleSanitization(updateArticleDto);
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    let coverImage: string | undefined;
    let coverImageKey: string | undefined;
    let oldCoverImageKey = article.coverImageKey;

    // Upload new file if provided
    if (file) {
      try {
        const uploadResult = await this.communityS3Service.uploadFile(
          file,
          'articles',
          article._id.toString(),
          userId || article.author.toString(),
        );
        coverImage = uploadResult.url;
        coverImageKey = uploadResult.key;
      } catch (error) {
        throw new BadRequestException(`Failed to upload cover image: ${error.message}`);
      }
    }

    // Check slug uniqueness if provided
    if (updateArticleDto.slug && updateArticleDto.slug !== article.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: updateArticleDto.slug,
        _id: { $ne: id },
      });
      if (existingArticle) {
        // If file was uploaded, delete it
        if (coverImageKey) {
          await this.communityS3Service.deleteFile(coverImageKey);
        }
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    // Update article data
    const updateData = {
      ...updateArticleDto,
      ...(coverImage && { coverImage }),
      ...(coverImageKey && { coverImageKey }),
    };

    Object.assign(article, updateData);
    const updatedArticle = await article.save();

    // Delete old cover image from S3 if a new one was uploaded
    if (oldCoverImageKey && coverImageKey && oldCoverImageKey !== coverImageKey) {
      try {
        await this.communityS3Service.deleteFile(oldCoverImageKey);
      } catch (error) {
        // Log error but don't fail the update
        console.error('Failed to delete old cover image from S3:', error);
      }
    }

    return updatedArticle;
  }

  async updateArticleWithMultipleFiles(
    id: string,
    updateArticleDto: UpdateArticleDto,
    files?: Express.Multer.File[],
    userId?: string,
    role?: string,
  ): Promise<IArticle> {
    applyArticleSanitization(updateArticleDto);
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    let uploadedImages: string[] = [];
    let uploadedImageKeys: string[] = [];
    const oldImageKeys = article.imageKeys || [];

    // Upload new files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const uploadResult = await this.communityS3Service.uploadFile(
            file,
            'articles',
            article._id.toString(),
            article.author.toString()
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
          throw new BadRequestException(`Failed to upload article image: ${error.message}`);
        }
      }
    }

    // Check slug uniqueness if provided
    if (updateArticleDto.slug && updateArticleDto.slug !== article.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: updateArticleDto.slug,
        _id: { $ne: id },
      });
      if (existingArticle) {
        // If files were uploaded, delete them
        if (uploadedImageKeys.length > 0) {
          for (const key of uploadedImageKeys) {
            try {
              await this.communityS3Service.deleteFile(key);
            } catch (cleanupError) {
              console.error('Failed to cleanup uploaded file:', cleanupError);
            }
          }
        }
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    // Update article data
    const updateData = {
      ...updateArticleDto,
    };
    
    Object.assign(article, updateData);
    
    // Replace images if new ones were uploaded
    if (uploadedImages.length > 0) {
      article.images = uploadedImages;
      article.imageKeys = uploadedImageKeys;
    }

    const updatedArticle = await article.save();

    // Delete old images from S3 if new ones were uploaded
    if (oldImageKeys.length > 0 && uploadedImageKeys.length > 0) {
      const deletePromises = oldImageKeys.map(key => 
        this.communityS3Service.deleteFile(key).catch(error => 
          console.error('Failed to delete old image from S3:', error)
        )
      );
      await Promise.allSettled(deletePromises);
    }

    return updatedArticle;
  }

  }
