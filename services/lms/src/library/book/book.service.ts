import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../schema/book/book.schema';
import {
  BookProgress,
  BookProgressDocument,
} from '../schema/book/book-progress.schema';
import {
  CreateBookDto,
  UpdateBookDto,
  PublishBookDto,
  UpdateProgressDto,
} from './dto/book.dto';
import { LibraryAsset, LibraryAssetDocument } from '../schema/library-asset.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<BookDocument>,
    @InjectModel(BookProgress.name)
    private readonly bookProgressModel: Model<BookProgressDocument>,
    @InjectModel(LibraryAsset.name)
    private readonly libraryAssetModel: Model<LibraryAssetDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async createBookService(data: CreateBookDto, userId: string) {
    const bookData = {
      ...data,
      createdBy: userId,
      status: data.status || 'PUBLISHED'
    };
    const book = await this.bookModel.create(bookData);
    if (!book) throw new BadRequestException('Book not created');
    return book;
  }

  async publishBookService(id: string, data: PublishBookDto, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to publish this book',
      );

    const updatedBook = await this.bookModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedBook) throw new BadRequestException('Book not published');
    return updatedBook;
  }

  async getBooksService(query: {
    q?: string;
    topics?: string[];
    level?: string;
    sort?: string;
    page?: number;
    limit?: number;
    status?: string;
    userRole?: string;
    userId?: string;
  }) {
    const {
      q,
      topics,
      level,
      sort = 'new',
      page = 1,
      limit = 12,
      status,
      userRole,
      userId,
    } = query;
    const filter: any = {};
    
    // Role-based filtering logic
    if (userRole === 'INSTRUCTOR_USER') {
      // Instructors can see all books they created, plus all published books
      if (userId) {
        filter.$or = [
          { createdBy: userId },
          { status: 'PUBLISHED' }
        ];
      }
    } else {
      // Students and other roles only see published books
      filter.status = 'PUBLISHED';
    }
    
    // Apply explicit status filter if provided (but don't override role-based logic for students)
    if (status && userRole === 'INSTRUCTOR_USER') {
      if (userId) {
        filter.$or = [
          { createdBy: userId, status: status },
          { status: 'PUBLISHED' }
        ];
      }
    }
    
    if (q) filter.$text = { $search: q };
    if (topics && topics.length) filter.topics = { $in: topics };
    if (level) filter.level = level;

    const sortMap: Record<string, any> = {
      new: { createdAt: -1 },
      popular: { 'metrics.favoritesCount': -1 },
      rating: { 'metrics.ratingAverage': -1 },
    };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort(sortMap[sort] || sortMap.new)
        .skip(skip)
        .limit(limit),
      this.bookModel.countDocuments(filter),
    ]);

    // Generate or retrieve presigned URLs for books with fileAssetId
    const booksWithUrls = await Promise.all(
      items.map(async (book) => {
        const bookObj = book.toObject();
        
        if (book.fileAssetId) {
          try {
            const asset = await this.libraryAssetModel.findById(book.fileAssetId);
            if (asset?.objectKey) {
              let contentUrl: string | undefined;
              
              // Check if we have a valid stored presigned URL
              if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
                const now = new Date();
                const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);
                
                if (now < expiresAt) {
                  contentUrl = asset.urls.presignedUrl;
                }
              }
              
              // Generate new presigned URL if none exists or expired
              if (!contentUrl) {
                contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
                // Store the new presigned URL in database with 1 hour expiration
                const expiresAt = new Date(Date.now() + 3600 * 1000);
                await this.libraryAssetModel.findByIdAndUpdate(book.fileAssetId, {
                  'urls.presignedUrl': contentUrl,
                  'urls.presignedUrlExpiresAt': expiresAt,
                });
              }
              
              (bookObj as any).contentUrl = contentUrl;
            }
          } catch (error) {
            console.error(`Failed to generate presigned URL for book ${book._id}:`, error);
            // Continue without presigned URL
          }
        }
        
        return bookObj;
      })
    );

    return { items: booksWithUrls, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBookByIdService(id: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    
    const bookObj = book.toObject();
    
    if (book.fileAssetId) {
      try {
        const asset = await this.libraryAssetModel.findById(book.fileAssetId);
        if (asset?.objectKey) {
          let contentUrl: string | undefined;
          
          // Check if we have a valid stored presigned URL
          if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);
            
            if (now < expiresAt) {
              contentUrl = asset.urls.presignedUrl;
            }
          }
          
          // Generate new presigned URL if none exists or expired
          if (!contentUrl) {
            contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
            // Store the new presigned URL in database with 1 hour expiration
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await this.libraryAssetModel.findByIdAndUpdate(book.fileAssetId, {
              'urls.presignedUrl': contentUrl,
              'urls.presignedUrlExpiresAt': expiresAt,
            });
          }
          
          (bookObj as any).contentUrl = contentUrl;
        }
      } catch (error) {
        console.error(`Failed to generate presigned URL for book ${book._id}:`, error);
        // Continue without presigned URL
      }
    }
    
    return bookObj;
  }

  async getBookBySlugService(slug: string) {
    const book = await this.bookModel.findOne({ slug });
    if (!book) throw new NotFoundException('Book not found');
    
    const bookObj = book.toObject();
    
    if (book.fileAssetId) {
      try {
        const asset = await this.libraryAssetModel.findById(book.fileAssetId);
        if (asset?.objectKey) {
          let contentUrl: string | undefined;
          
          // Check if we have a valid stored presigned URL
          if (asset.urls?.presignedUrl && asset.urls?.presignedUrlExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(asset.urls.presignedUrlExpiresAt);
            
            if (now < expiresAt) {
              contentUrl = asset.urls.presignedUrl;
            }
          }
          
          // Generate new presigned URL if none exists or expired
          if (!contentUrl) {
            contentUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
            // Store the new presigned URL in database with 1 hour expiration
            const expiresAt = new Date(Date.now() + 3600 * 1000);
            await this.libraryAssetModel.findByIdAndUpdate(book.fileAssetId, {
              'urls.presignedUrl': contentUrl,
              'urls.presignedUrlExpiresAt': expiresAt,
            });
          }
          
          (bookObj as any).contentUrl = contentUrl;
        }
      } catch (error) {
        console.error(`Failed to generate presigned URL for book ${book._id}:`, error);
        // Continue without presigned URL
      }
    }
    
    return bookObj;
  }

  async updateBookService(id: string, data: UpdateBookDto, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to update this book',
      );

    const updatedBook = await this.bookModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedBook) throw new BadRequestException('Book not updated');
    return updatedBook;
  }

  async deleteBookService(id: string, userId: string) {
    const book = await this.bookModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    if (book.createdBy.toString() !== userId)
      throw new ForbiddenException(
        'You are not authorized to delete this book',
      );

    const deletedBook = await this.bookModel.findByIdAndDelete(id);
    if (!deletedBook) throw new BadRequestException('Book not deleted');
    return { message: 'Book deleted successfully' };
  }

  async getMyBookProgressService(bookId: string, userId: string) {
    const progressBook = await this.bookProgressModel.findOne({
      userId,
      bookId,
    });
    if (!progressBook)
      return { lastPage: 0, timeSpentSec: 0, completed: false };
    return {
      lastPage: progressBook.lastPage,
      timeSpentSec: progressBook.timeSpentSec,
      completed: progressBook.completed,
    };
  }

  async updateBookProgressService(
    bookId: string,
    userId: string,
    payload: UpdateProgressDto,
  ) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    const progressBook = await this.bookProgressModel.findOneAndUpdate(
      { userId, bookId },
      {
        $set: {
          lastPage: payload.lastPage,
          completed: !!payload.completed,
          completedAt: payload.completed ? new Date() : undefined,
        },
        $inc: { timeSpentSec: payload.timeSpentSec || 0 },
      },
      { new: true, upsert: true },
    );
    return progressBook;
  }

  async getAllBookLinksService() {
    const books = await this.bookModel.find({ fileAssetId: { $exists: true, $ne: null } });
    
    const links = await Promise.all(
      books.map(async (book) => {
        try {
          if (book.fileAssetId) {
            const asset = await this.libraryAssetModel.findById(book.fileAssetId);
            if (asset?.objectKey) {
              const presignedUrl = await this.s3Service.getPresignedGetUrl(asset.objectKey);
              return {
                id: book._id,
                title: book.title,
                slug: book.slug,
                fileName: asset.originalFileName || asset.objectKey.split('/').pop(),
                objectKey: asset.objectKey,
                presignedUrl,
                uploadedAt: (book as any).createdAt,
                contentType: asset.mimeType,
                size: asset.size
              };
            }
          }
        } catch (error) {
          console.error(`Failed to generate presigned URL for book ${book._id}:`, error);
          return {
            id: book._id,
            title: book.title,
            slug: book.slug,
            error: 'Failed to generate presigned URL'
          };
        }
        return null;
      })
    );

    return {
      links: links.filter(link => link !== null),
      total: links.filter(link => link !== null).length
    };
  }
}
