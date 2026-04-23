/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { UploadedFile as CustomUploadedFile } from '../../../common/interfaces/file.interface';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ArticlesGatewayService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Community Articles')
@ApiBearerAuth()
@Controller('api/v1/community/articles')
@UseGuards(JwtAuthGuard)
export class ArticlesGatewayController {
  constructor(private readonly articlesService: ArticlesGatewayService) {}

  @ApiOperation({
    summary: 'Create a new article',
    description:
      'Creates a new article with optional single or multiple image uploads',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Getting Started with NestJS' },
        description: {
          type: 'string',
          example: 'A comprehensive guide to NestJS framework',
        },
        contentBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['text', 'code', 'image', 'quote', 'link'],
              },
              order: { type: 'number', example: 1 },
              content: { type: 'string', example: 'Your content here' },
              language: { type: 'string', example: 'typescript' },
              code: { type: 'string', example: 'console.log("Hello World");' },
              filename: { type: 'string', example: 'example.ts' },
              url: { type: 'string', example: 'https://example.com' },
              caption: { type: 'string', example: 'Image caption' },
              alt: { type: 'string', example: 'Alt text' },
              quoteAuthor: { type: 'string', example: 'Author Name' },
              quoteSource: { type: 'string', example: 'Source Name' },
            },
          },
        },
        category: {
          type: 'array',
          items: { type: 'string' },
          example: ['backend', 'nestjs'],
        },
        seoMetadata: {
          type: 'object',
          properties: {
            metaTitle: { type: 'string', example: 'SEO Title' },
            metaDescription: { type: 'string', example: 'SEO Description' },
            keywords: { type: 'array', items: { type: 'string' } },
          },
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more image files for the article (max 10 files)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Article created successfully' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Getting Started with NestJS' },
            slug: { type: 'string', example: 'getting-started-with-nestjs' },
            description: {
              type: 'string',
              example: 'A comprehensive guide to NestJS framework',
            },
            contentBlocks: { type: 'array', items: { type: 'object' } },
            category: { type: 'array', items: { type: 'string' } },
            coverImage: {
              type: 'string',
              example: 'https://example.com/cover.jpg',
              nullable: true,
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'https://example.com/image1.jpg',
                'https://example.com/image2.jpg',
              ],
              nullable: true,
            },
            status: { type: 'string', example: 'draft' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token is required',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  async create(
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: CustomUploadedFile[] | undefined,
    @Request() req: any,
  ) {
    // Parse JSON strings from multipart form data
    let contentBlocks = body.contentBlocks;
    let category = body.category;
    let seoMetadata = body.seoMetadata;

    if (typeof contentBlocks === 'string') {
      try {
        contentBlocks = JSON.parse(contentBlocks);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for contentBlocks');
      }
    }

    // Handle case where contentBlocks is sent as object instead of array
    if (contentBlocks && !Array.isArray(contentBlocks)) {
      contentBlocks = [contentBlocks];
    }

    if (typeof category === 'string') {
      // Handle comma-separated or JSON array format
      try {
        category = JSON.parse(category);
      } catch {
        // If not JSON, split by comma
        category = (category as string)
          .split(',')
          .map((cat: string) => cat.trim())
          .filter((cat: string) => cat);
      }
    }

    if (typeof seoMetadata === 'string') {
      try {
        seoMetadata = JSON.parse(seoMetadata);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for seoMetadata');
      }
    }

    const createArticleDto = plainToInstance(CreateArticleDto, {
      title: body.title,
      description: body.description,
      contentBlocks,
      category,
      seoMetadata,
    });

    const errors = await validate(createArticleDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return firstValueFrom(
      this.articlesService.createArticle(
        createArticleDto,
        undefined,
        files,
        req.user._id,
      ),
    );
  }

  @ApiOperation({
    summary: 'Get all articles',
    description:
      'Retrieves a paginated list of articles with optional filtering',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'backend',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    example: 'John Doe',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['draft', 'published', 'archived'],
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Categories retrieved successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', example: 'frontend' },
              articlesCount: { type: 'number', example: 3 },
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011',
                    },
                    title: {
                      type: 'string',
                      example: 'Getting Started with React',
                    },
                    slug: {
                      type: 'string',
                      example: 'getting-started-with-react',
                    },
                    description: {
                      type: 'string',
                      example: 'A comprehensive guide to React framework',
                    },
                    author: {
                      type: 'object',
                      properties: {
                        _id: {
                          type: 'string',
                          example: '507f1f77bcf86cd799439012',
                        },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                      },
                    },
                    category: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['frontend', 'react'],
                    },
                    publishedStatus: { type: 'string', example: 'published' },
                    createdAt: {
                      type: 'string',
                      example: '2023-01-01T00:00:00.000Z',
                    },
                    updatedAt: {
                      type: 'string',
                      example: '2023-01-01T00:00:00.000Z',
                    },
                  },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 8 },
            totalPages: { type: 'number', example: 1 },
            hasNext: { type: 'boolean', example: false },
            hasPrev: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @Get()
  async findAll(@Query() query: QueryArticlesDto) {
    return firstValueFrom(this.articlesService.getArticles(query));
  }

  @ApiOperation({})
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Article retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Getting Started with NestJS' },
            slug: { type: 'string', example: 'getting-started-with-nestjs' },
            description: {
              type: 'string',
              example: 'A comprehensive guide to NestJS framework',
            },
            contentBlocks: { type: 'array', items: { type: 'object' } },
            category: { type: 'array', items: { type: 'string' } },
            coverImage: {
              type: 'string',
              example: 'https://example.com/cover.jpg',
            },
            status: { type: 'string', example: 'published' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(this.articlesService.getArticleById(id));
  }

  @ApiOperation({
    summary: 'Get article by slug',
    description: 'Retrieves a specific article by its slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'The URL-friendly slug of the article',
    example: 'getting-started-with-nestjs',
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return firstValueFrom(this.articlesService.getArticleBySlug(slug));
  }

  @ApiOperation({
    summary: 'Update an article',
    description:
      'Updates an existing article with optional multiple image uploads. If new images are provided, old images will be deleted and replaced.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Advanced NestJS Patterns and Best Practices',
          description: 'Updated article title',
        },
        description: {
          type: 'string',
          example:
            'A comprehensive guide to advanced NestJS patterns including dependency injection, middleware, and microservices architecture.',
          description: 'Updated article description',
        },
        contentBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['text', 'code', 'image', 'quote', 'link'],
                example: 'text',
              },
              order: { type: 'number', example: 1 },
              content: {
                type: 'string',
                example:
                  'NestJS provides a robust framework for building scalable server-side applications with TypeScript.',
              },
              language: { type: 'string', example: 'typescript' },
              code: {
                type: 'string',
                example:
                  '@Injectable()\nexport class ArticleService {\n  constructor(private readonly repository: ArticleRepository) {}\n}',
              },
              filename: { type: 'string', example: 'article.service.ts' },
              url: {
                type: 'string',
                example: 'https://example.com/nestjs-architecture.png',
              },
              caption: {
                type: 'string',
                example: 'NestJS Architecture Diagram',
              },
              alt: {
                type: 'string',
                example: 'Diagram showing NestJS module structure',
              },
              quoteAuthor: { type: 'string', example: 'Kamil Myśliwiec' },
              quoteSource: { type: 'string', example: 'NestJS Documentation' },
            },
          },
          example: [
            {
              type: 'text',
              order: 1,
              content:
                'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
            },
            {
              type: 'code',
              order: 2,
              language: 'typescript',
              code: "@Controller('articles')\nexport class ArticlesController {\n  @Get()\n  findAll() {\n    return 'Hello World!';\n  }\n}",
              filename: 'articles.controller.ts',
            },
            {
              type: 'quote',
              order: 3,
              content:
                'NestJS provides an out-of-the-box application architecture which allows developers and teams to create highly testable, scalable, loosely coupled, and easily maintainable applications.',
              quoteAuthor: 'NestJS Team',
              quoteSource: 'Official Documentation',
            },
          ],
        },
        category: {
          type: 'array',
          items: { type: 'string' },
          example: ['backend', 'nestjs', 'typescript', 'architecture'],
          description: 'Updated article categories',
        },
        seoMetadata: {
          type: 'object',
          properties: {
            metaTitle: {
              type: 'string',
              example: 'Advanced NestJS Patterns - Complete Guide 2024',
            },
            metaDescription: {
              type: 'string',
              example:
                'Learn advanced NestJS patterns, dependency injection, middleware, and microservices. Complete guide with examples and best practices.',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'nestjs',
                'typescript',
                'backend',
                'nodejs',
                'microservices',
                'architecture',
              ],
            },
          },
          example: {
            metaTitle: 'Advanced NestJS Patterns - Complete Guide 2024',
            metaDescription:
              'Learn advanced NestJS patterns, dependency injection, middleware, and microservices. Complete guide with examples and best practices.',
            keywords: [
              'nestjs',
              'typescript',
              'backend',
              'nodejs',
              'microservices',
              'architecture',
            ],
          },
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Optional one or more image files for the article (max 10 files). Old images will be deleted and replaced with new ones.',
        },
      },
      required: ['title', 'description', 'contentBlocks', 'category'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this article',
  })
  @Put(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFiles() files: CustomUploadedFile[] | undefined,
    @Request() req: any,
  ) {
    // Parse JSON strings from multipart form data
    let contentBlocks = body.contentBlocks;
    let category = body.category;
    let seoMetadata = body.seoMetadata;

    if (contentBlocks && typeof contentBlocks === 'string') {
      try {
        contentBlocks = JSON.parse(contentBlocks);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for contentBlocks');
      }
    }

    if (category && typeof category === 'string') {
      try {
        category = JSON.parse(category);
      } catch {
        category = (category as string)
          .split(',')
          .map((cat: string) => cat.trim())
          .filter((cat: string) => cat);
      }
    }

    if (seoMetadata && typeof seoMetadata === 'string') {
      try {
        seoMetadata = JSON.parse(seoMetadata);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for seoMetadata');
      }
    }

    const updateArticleDto = plainToInstance(UpdateArticleDto, {
      title: body.title,
      description: body.description,
      contentBlocks,
      category,
      seoMetadata,
    });

    const errors = await validate(updateArticleDto);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return firstValueFrom(
      this.articlesService.updateArticle(
        id,
        updateArticleDto,
        files,
        req.user._id,
        req.user.role,
      ),
    );
  }

  @ApiOperation({
    summary: 'Delete an article',
    description: 'Deletes an article by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to delete this article',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.articlesService.deleteArticle(id, req.user._id, req.user.role),
    );
  }

  @ApiOperation({
    summary: 'Approve an article',
    description: 'Changes article status to published (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Article approved successfully',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @Put(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.articlesService.approveArticle(id, req.user._id, req.user.role),
    );
  }
}
