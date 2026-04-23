import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Book, BookDocument } from '../schema/book/book.schema';
import { Guide, GuideDocument } from '../schema/guide.schema';
import { Presentation, PresentationDocument } from '../schema/presentation.schema';
import { LibraryType, LibraryTopics } from '../schema/library.schema';
import { UploadService } from '../upload/upload.service';

export interface GetAllByTypeQuery {
  /** Filter by content type ('book' | 'guide' | 'presentation') */
  type?: LibraryType;
  /** Search query for title, summary, and description */
  q?: string;
  /** Filter by topics (array of strings) */
  topics?: string[];
  /** Filter by difficulty level ('Beginner' | 'Intermediate' | 'Advanced') */
  level?: string;
  /** Sort order ('title' | 'createdAt' | 'updatedAt' | 'views' | 'rating') */
  sort?: string;
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 10) */
  limit?: number;
  /** Filter by status ('DRAFT' | 'PUBLISHED' | 'ARCHIVED') */
  status?: string;
}

export interface GetTopicsQuery {
  topic?: LibraryTopics;
  topics?: string[];
  type?: LibraryType;
  q?: string;
  level?: string;
  sort?: string;
  page?: number;
  limit?: number;
  status?: string;
}

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Guide.name) private guideModel: Model<GuideDocument>,
    @InjectModel(Presentation.name) private presentationModel: Model<PresentationDocument>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get all library items by type with optional filtering
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated result with items, total count, and metadata
   */
  async getAllByType(query: GetAllByTypeQuery) {
    const { type, q, topics, level, sort, page = 1, limit = 10, status } = query;
    
    // If no type specified, get all items from all collections
    if (!type) {
      const [books, guides, presentations] = await Promise.all([
        this.getItemsFromModel(this.bookModel, { q, topics, level, sort, page, limit, status }),
        this.getItemsFromModel(this.guideModel, { q, topics, level, sort, page, limit, status }),
        this.getItemsFromModel(this.presentationModel, { q, topics, level, sort, page, limit, status }),
      ]);
      
      return {
        items: [...books.items, ...guides.items, ...presentations.items],
        total: books.total + guides.total + presentations.total,
        page,
        limit,
        totalPages: Math.ceil((books.total + guides.total + presentations.total) / limit),
      };
    }

    // Get items from specific collection based on type
    switch (type) {
      case 'book':
        return this.getItemsFromModel(this.bookModel, { q, topics, level, sort, page, limit, status });
      case 'guide':
        return this.getItemsFromModel(this.guideModel, { q, topics, level, sort, page, limit, status });
      case 'presentation':
        return this.getItemsFromModel(this.presentationModel, { q, topics, level, sort, page, limit, status });
      default:
        throw new Error(`Invalid type: ${type}`);
    }
  }

  private async getItemsFromModel(
    model: Model<any>,
    { q, topics, level, sort, page, limit, status }: {
      q?: string;
      topics?: string[];
      level?: string;
      sort?: string;
      page?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (level) {
      filter.level = level;
    }
    
    if (topics && topics.length > 0) {
      filter.topics = { $in: topics };
    }
    
    if (q) {
      filter.$text = { $search: q };
    }

    const sortOptions = this.getSortOptions(sort);
    const skip = ((page || 1) - 1) * (limit || 10);

    const [items, total] = await Promise.all([
      model.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit || 10)
        .populate('fileAssetId')
        .lean(),
      model.countDocuments(filter)
    ]);

    // Add presigned URLs for items with fileAssetId
    const itemsWithUrls = await Promise.all(
      items.map(async (item: any) => {
        if (item.fileAssetId) {
          try {
            const presignedUrl = await this.uploadService.getValidPresignedUrl(item.fileAssetId._id?.toString() || item.fileAssetId.toString());
            
            // Remove presigned URLs from nested fileAssetId to avoid duplication
            const cleanedFileAssetId = {
              ...item.fileAssetId,
              urls: {
                ...item.fileAssetId.urls,
                presignedUrl: undefined,
                presignedUrlExpiresAt: undefined,
              },
            };
            
            return {
              ...item,
              fileAssetId: cleanedFileAssetId,
              presignedUrl,
            };
          } catch (error) {
            // If presigned URL generation fails, return item without URL
            console.error(`Failed to generate presigned URL for item ${item._id}:`, error);
            return item;
          }
        }
        return item;
      })
    );

    return {
      items: itemsWithUrls,
      total,
      page: page || 1,
      limit: limit || 10,
      totalPages: Math.ceil(total / (limit || 10)),
    };
  }

  private getSortOptions(sort?: string): { [key: string]: SortOrder } {
    switch (sort) {
      case 'title':
        return { title: 1 as SortOrder };
      case 'createdAt':
        return { createdAt: -1 as SortOrder };
      case 'updatedAt':
        return { updatedAt: -1 as SortOrder };
      case 'views':
        return { 'metrics.views': -1 as SortOrder };
      case 'rating':
        return { 'metrics.ratingAverage': -1 as SortOrder };
      default:
        return { createdAt: -1 as SortOrder };
    }
  }

  /**
   * Get available topics with optional filtering
   * @param query - Query parameters for filtering topics
   * @returns List of available topics and filtered items
   */
  async getTopics(query: GetTopicsQuery) {
    const { topic, topics, type, q, level, sort, page = 1, limit = 10, status } = query;
    
    // Get all available topics
    const allTopics = Object.values(LibraryTopics);
    
    // If no specific topic filtering, return all available topics
    if (!topic && !topics) {
      return {
        topics: allTopics,
        total: allTopics.length,
        items: [], // No items when just getting topics list
        page: 1,
        limit: 10,
        totalPages: 1,
      };
    }
    
    // Convert topics to array for filtering
    const topicsArray = topic ? [topic] : (topics ? topics : []);
    
    // Use getAllByType to get filtered items
    const itemsResult = await this.getAllByType({
      type,
      q,
      topics: topicsArray,
      level,
      sort,
      page,
      limit,
      status,
    });
    
    return {
      topics: allTopics,
      totalTopics: allTopics.length,
      itemsTotal: itemsResult.total,
      items: itemsResult.items,
      page: itemsResult.page,
      limit: itemsResult.limit,
      totalPages: itemsResult.totalPages,
    };
  }

  /**
   * Get total count of all materials in the library
   * @returns Total count of books, guides, and presentations
   */
  async getTotalMaterials() {
    const [bookCount, guideCount, presentationCount] = await Promise.all([
      this.bookModel.countDocuments(),
      this.guideModel.countDocuments(),
      this.presentationModel.countDocuments(),
    ]);

    return {
      total: bookCount + guideCount + presentationCount,
      books: bookCount,
      guides: guideCount,
      presentations: presentationCount,
      breakdown: {
        books: {
          count: bookCount,
          percentage: ((bookCount / (bookCount + guideCount + presentationCount)) * 100).toFixed(2),
        },
        guides: {
          count: guideCount,
          percentage: ((guideCount / (bookCount + guideCount + presentationCount)) * 100).toFixed(2),
        },
        presentations: {
          count: presentationCount,
          percentage: ((presentationCount / (bookCount + guideCount + presentationCount)) * 100).toFixed(2),
        },
      },
    };
  }
}
