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

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    private readonly s3Service: S3Service,
    private readonly communityS3Service: CommunityS3Service,
  ) {}

  // Article CRUD Operations
  async createArticle(createArticleDto: CreateArticleDto): Promise<IArticle> {
    // Set default author ID
    const articleData = {
      ...createArticleDto,
      author: '507f1f77bcf86cd799439013', // Default author ID
    };

    // Check if slug already exists
    if (articleData.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: articleData.slug,
      });
      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    const article = new this.articleModel(articleData);
    return article.save();
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<IArticle> {
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
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(paginationOptions.limit)
        .exec(),
      this.articleModel.countDocuments(filter),
    ]);

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

  // Article CRUD Operations with file upload
  async createArticleWithFile(
    createArticleDto: CreateArticleDto,
    file?: Express.Multer.File,
    userId?: string,
  ): Promise<IArticle> {
    let coverImage: string | undefined;
    let coverImageKey: string | undefined;
    const finalUserId = userId || '507f1f77bcf86cd799439013'; // Default author ID

    // Check if slug already exists first
    if (createArticleDto.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: createArticleDto.slug,
      });
      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    // Create article first to get articleId
    const articleData = {
      ...createArticleDto,
      author: finalUserId,
      coverImage: null,
      coverImageKey: null,
    };

    const article = await this.articleModel.create(articleData);

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
      .populate('author', 'name email avatar')
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
    let uploadedImages: string[] = [];
    let uploadedImageKeys: string[] = [];
    const finalUserId = userId || '507f1f77bcf86cd799439013'; // Default author ID

    // Check if slug already exists first
    if (createArticleDto.slug) {
      const existingArticle = await this.articleModel.findOne({
        slug: createArticleDto.slug,
      });
      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    // Create article first to get articleId
    const articleData = {
      ...createArticleDto,
      author: finalUserId,
      coverImage: null,
      coverImageKey: null,
      images: null,
      imageKeys: null,
    };

    const article = await this.articleModel.create(articleData);

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
      .populate('author', 'name email avatar')
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
          'articles'
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
