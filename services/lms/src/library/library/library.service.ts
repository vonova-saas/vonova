import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Book, BookDocument } from '../schema/book/book.schema';
import { Guide, GuideDocument } from '../schema/guide.schema';
import {
  Presentation,
  PresentationDocument,
} from '../schema/presentation.schema';
import { LibraryType, LibraryTopics } from '../schema/library.schema';
import { UploadService } from '../upload/upload.service';
import { EnrollService } from '../../course/enroll/enroll.service';

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
  /** Authenticated requester id — used to hide PRIVATE items from non-creators. */
  userId?: string;
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
  /** Authenticated requester id — used to hide PRIVATE items from non-creators. */
  userId?: string;
}

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Guide.name) private guideModel: Model<GuideDocument>,
    @InjectModel(Presentation.name) private presentationModel: Model<PresentationDocument>,
    private readonly uploadService: UploadService,
    private readonly enrollService: EnrollService,
  ) { }

  /** Course-linked or visibility-restricted materials use LMS enrollment rules. */
  async canAccessMaterial(
    materialId: string,
    userId: string | undefined,
    materialType?: string,
  ): Promise<boolean> {
    const norm = (materialType || '').toLowerCase().trim();
    const order: ('BOOK' | 'GUIDE' | 'PRESENTATION')[] =
      norm === 'book' || norm === 'books'
        ? ['BOOK']
        : norm === 'guide' || norm === 'guides' || norm === 'visual-guide'
          ? ['GUIDE']
          : norm === 'presentation' || norm === 'presentations'
            ? ['PRESENTATION']
            : ['BOOK', 'GUIDE', 'PRESENTATION'];

    for (const kind of order) {
      let doc: Record<string, unknown> | null = null;
      if (kind === 'BOOK') {
        doc = (await this.bookModel.findById(materialId).lean()) as Record<
          string,
          unknown
        > | null;
      } else if (kind === 'GUIDE') {
        doc = (await this.guideModel.findById(materialId).lean()) as Record<
          string,
          unknown
        > | null;
      } else {
        doc = (await this.presentationModel
          .findById(materialId)
          .lean()) as Record<string, unknown> | null;
      }
      if (doc) {
        return this.canSeeLibraryItem(doc, userId);
      }
    }
    return false;
  }

  /**
   * Direct-view access gate (e.g. opening a material from a lesson page or
   * presigned download). Distinct from `canListLibraryItem` so that PRIVATE
   * items can still be opened by enrolled students through the lesson, even
   * though they are intentionally hidden from the global Material Library
   * browse listings.
   */
  private async canSeeLibraryItem(
    item: Record<string, unknown>,
    userId: string | undefined,
  ): Promise<boolean> {
    const isOwner =
      !!userId && String(item.createdBy ?? '') === userId;
    if (isOwner) return true;

    const vis = (item.visibility as string | undefined) ?? 'PUBLIC';
    const courseId = item.courseId;

    if (vis === 'PRIVATE') {
      // Enrolled students of the scoped course can open a PRIVATE material
      // through the lesson page; everyone else is blocked. We require an
      // actual enrollment record (not just course visibility) so that
      // PRIVATE materials attached to a PUBLIC course don't accidentally
      // leak to anonymous visitors.
      if (!courseId || !userId) return false;
      return this.enrollService.isEnrolled(String(courseId), userId);
    }

    // PUBLIC: respect publication status (drafts/archives are creator-only,
    // which we've already handled via the `isOwner` short-circuit above).
    const st = item.status as string | undefined;
    if (st && st !== 'PUBLISHED') {
      return false;
    }
    return true;
  }

  /**
   * Listing visibility for global browse pages (Material Library, search,
   * topic feeds). PRIVATE materials are intentionally hidden from everyone
   * except the creator — enrolled students reach them only via the lesson
   * page (`canSeeLibraryItem`).
   */
  private canListLibraryItem(
    item: Record<string, unknown>,
    userId: string | undefined,
  ): boolean {
    const isOwner =
      !!userId && String(item.createdBy ?? '') === userId;
    if (isOwner) return true;

    const vis = (item.visibility as string | undefined) ?? 'PUBLIC';
    if (vis === 'PRIVATE') return false;

    const st = item.status as string | undefined;
    if (st && st !== 'PUBLISHED') return false;
    return true;
  }

  private async assertMaterialViewAllowed(
    doc: Record<string, unknown>,
    userId: string | undefined,
  ): Promise<void> {
    const ok = await this.canSeeLibraryItem(doc, userId);
    if (!ok) {
      throw new ForbiddenException('You do not have access to this material');
    }
  }

  private filterItemsByAccess(
    items: Record<string, unknown>[],
    userId?: string,
  ): Record<string, unknown>[] {
    return items.filter((it) => this.canListLibraryItem(it, userId));
  }

  /**
   * Get all library items by type with optional filtering
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated result with items, total count, and metadata
   */
  async getAllByType(query: GetAllByTypeQuery) {
    const {
      type,
      q,
      topics,
      level,
      sort,
      page = 1,
      limit = 10,
      status,
      userId,
    } = query;

    const baseParams = { q, topics, level, sort, page, limit, status, userId };

    // If no type specified, get all items from all collections
    if (!type) {
      const [books, guides, presentations] = await Promise.all([
        this.getItemsFromModel(this.bookModel, baseParams),
        this.getItemsFromModel(this.guideModel, baseParams),
        this.getItemsFromModel(this.presentationModel, baseParams),
      ]);

      return {
        items: [...books.items, ...guides.items, ...presentations.items],
        total: books.total + guides.total + presentations.total,
        page,
        limit,
        totalPages: Math.ceil(
          (books.total + guides.total + presentations.total) / limit,
        ),
      };
    }

    // Get items from specific collection based on type
    switch (type) {
      case 'book':
        return this.getItemsFromModel(this.bookModel, baseParams);
      case 'guide':
        return this.getItemsFromModel(this.guideModel, baseParams);
      case 'presentation':
        return this.getItemsFromModel(this.presentationModel, baseParams);
      default:
        throw new Error(`Invalid type: ${type}`);
    }
  }

  private async getItemsFromModel(
    model: Model<any>,
    {
      q,
      topics,
      level,
      sort,
      page,
      limit,
      status,
      userId,
    }: {
      q?: string;
      topics?: string[];
      level?: string;
      sort?: string;
      page?: number;
      limit?: number;
      status?: string;
      userId?: string;
    },
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

    // PRIVATE items are hidden from the global Material Library for everyone
    // except the creator. Enrolled students can still open PRIVATE items via
    // the lesson page (which goes through `assertMaterialViewAllowed`), so
    // hiding them from the browse listing here is the right enforcement
    // point.
    if (userId && Types.ObjectId.isValid(userId)) {
      filter.$or = [
        { createdBy: new Types.ObjectId(userId) },
        { visibility: { $ne: 'PRIVATE' } },
      ];
    } else {
      filter.visibility = { $ne: 'PRIVATE' };
    }

    const sortOptions = this.getSortOptions(sort);
    const skip = ((page || 1) - 1) * (limit || 10);

    const [items, total] = await Promise.all([
      model
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit || 10)
        .populate('fileAssetId')
        .lean(),
      model.countDocuments(filter),
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
    const {
      topic,
      topics,
      type,
      q,
      level,
      sort,
      page = 1,
      limit = 10,
      status,
    } = query;

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
    const topicsArray = topic ? [topic] : topics ? topics : [];

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
      userId: query.userId,
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
          percentage: (
            (bookCount / (bookCount + guideCount + presentationCount)) *
            100
          ).toFixed(2),
        },
        guides: {
          count: guideCount,
          percentage: (
            (guideCount / (bookCount + guideCount + presentationCount)) *
            100
          ).toFixed(2),
        },
        presentations: {
          count: presentationCount,
          percentage: (
            (presentationCount / (bookCount + guideCount + presentationCount)) *
            100
          ).toFixed(2),
        },
      },
    };
  }

  /**
   * Get unified materials list for frontend
   * Returns all materials organized by type
   */
  async getUnifiedMaterials(query: {
    page: number;
    limit: number;
    search?: string;
    userId?: string;
    userRole?: string;
  }) {
    const { page, limit, search, userId, userRole } = query;

    // Build filter based on user role. PRIVATE items are course-only and must
    // never appear in the unified Material Library list except for the
    // creator (instructors managing their own content).
    const filter: any = {};
    const ownerOid =
      userId && Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : null;
    if (userRole === 'INSTRUCTOR_USER' && ownerOid) {
      filter.$or = [
        { createdBy: ownerOid },
        {
          status: 'PUBLISHED',
          visibility: { $ne: 'PRIVATE' },
        },
      ];
    } else {
      filter.status = 'PUBLISHED';
      filter.visibility = { $ne: 'PRIVATE' };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    // Fetch all material types in parallel
    const [booksResult, guidesResult, presentationsResult] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.guideModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.presentationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const booksAllowed = await this.filterItemsByAccess(
      booksResult as Record<string, unknown>[],
      userId,
    );
    const guidesAllowed = await this.filterItemsByAccess(
      guidesResult as Record<string, unknown>[],
      userId,
    );
    const presentationsAllowed = await this.filterItemsByAccess(
      presentationsResult as Record<string, unknown>[],
      userId,
    );

    // Add type field and presigned URLs to each item
    const addTypeAndUrls = async (items: any[], type: string) => {
      return Promise.all(
        items.map(async (item) => {
          let contentUrl: string | undefined;
          if (item.fileAssetId) {
            try {
              contentUrl = await this.uploadService.getValidPresignedUrl(
                item.fileAssetId.toString(),
              );
            } catch (error) {
              console.error(`Failed to get presigned URL for ${type} ${item._id}:`, error);
            }
          }
          return {
            ...item,
            type,
            contentUrl,
          };
        }),
      );
    };

    const [books, guides, presentations] = await Promise.all([
      addTypeAndUrls(booksAllowed, 'BOOK'),
      addTypeAndUrls(guidesAllowed, 'GUIDE'),
      addTypeAndUrls(presentationsAllowed, 'PRESENTATION'),
    ]);

    const total = books.length + guides.length + presentations.length;

    return {
      message: 'Materials retrieved successfully',
      data: {
        books,
        guides,
        presentations,
        uploads: [], // Reserved for future file uploads collection
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Returns a time-limited S3 GET URL for a library material file.
   * @param materialId Mongo _id of book, guide, or presentation
   * @param materialType Optional hint: book | guide | presentation (case-insensitive)
   */
  async getMaterialViewSignedUrl(
    materialId: string,
    materialType?: string,
    userId?: string,
  ): Promise<{ success: true; data: { url: string } }> {
    if (!materialId) {
      throw new NotFoundException('Material id is required');
    }

    const norm = (materialType || '').toLowerCase().trim();
    const order: ('BOOK' | 'GUIDE' | 'PRESENTATION')[] =
      norm === 'book' || norm === 'books'
        ? ['BOOK']
        : norm === 'guide' || norm === 'guides' || norm === 'visual-guide'
          ? ['GUIDE']
          : norm === 'presentation' || norm === 'presentations'
            ? ['PRESENTATION']
            : ['BOOK', 'GUIDE', 'PRESENTATION'];

    const tryLoad = async (kind: 'BOOK' | 'GUIDE' | 'PRESENTATION') => {
      let doc: Record<string, unknown> | null = null;
      if (kind === 'BOOK') {
        doc = (await this.bookModel.findById(materialId).lean()) as Record<
          string,
          unknown
        > | null;
      } else if (kind === 'GUIDE') {
        doc = (await this.guideModel.findById(materialId).lean()) as Record<
          string,
          unknown
        > | null;
      } else {
        doc = (await this.presentationModel
          .findById(materialId)
          .lean()) as Record<string, unknown> | null;
      }
      if (!doc?.fileAssetId) return null;
      await this.assertMaterialViewAllowed(doc, userId);
      const url = await this.uploadService.getValidPresignedUrl(
        String(doc.fileAssetId),
      );
      return url;
    };

    for (const kind of order) {
      const url = await tryLoad(kind);
      if (url) return { success: true, data: { url } };
    }

    throw new NotFoundException('Material or file not found');
  }
}
