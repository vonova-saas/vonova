import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from '../schema/book/book.schema';
import { LibraryAsset } from '../schema/library-asset.schema';
import { Guide } from '../schema/guide.schema';
import { Presentation } from '../schema/presentation.schema';
import { BookProgress } from '../schema/book/book-progress.schema';
import { S3Service } from '../../common/utils/storage/s3.service';

@Injectable()
export class ReaderService {
  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(LibraryAsset.name)
    private readonly assetModel: Model<LibraryAsset>,
    @InjectModel(BookProgress.name)
    private readonly bookProgressModel: Model<BookProgress>,
    @InjectModel(Guide.name) private readonly guideModel: Model<Guide>,
    @InjectModel(Presentation.name)
    private readonly presentationModel: Model<Presentation>,

    private readonly s3Service: S3Service,
  ) {}

  private async getPresignedUrlIfNeeded(assetId?: Types.ObjectId | string) {
    if (!assetId) return undefined;
    const asset = await this.assetModel.findById(assetId);
    if (!asset) return undefined;
    if (asset.objectKey && this.s3Service?.getPresignedGetUrl) {
      return await this.s3Service.getPresignedGetUrl(asset.objectKey);
    }
    // fallback to asset urls if provided
    return asset.urls?.posterUrl;
  }

  async getBookContent(bookId: string, userId?: string) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    const pdfUrl = await this.getPresignedUrlIfNeeded(book.fileAssetId!);

    // fire-and-forget increment views
    this.bookModel
      .updateOne({ _id: book._id }, { $inc: { 'metrics.views': 1 } })
      .catch(() => {});

    const progress = await this.bookProgressModel.findOne({
      userId,
      bookId: book._id,
    });

    return {
      id: String(book._id),
      title: book.title,
      summary: book.summary,
      description: book.description,
      authors: book.authors,
      topics: book.topics,
      level: book.level,
      coverUrl: book.coverUrl,
      language: book.language,
      pageCount: book.pageCount,
      readingTimeMin: book.readingTimeMin,
      pdfUrl,
      progress: progress
        ? { lastPage: progress.lastPage, completed: progress.completed }
        : undefined,
    };
  }

  async updateBookProgress(
    bookId: string,
    userId: string,
    payload: { lastPage: number; timeSpentSec?: number; completed?: boolean },
  ) {
    const book = await this.bookModel.findById(bookId);
    if (!book) throw new NotFoundException('Book not found');

    const update = {
      $set: {
        lastPage: payload.lastPage,
        completed: !!payload.completed,
        completedAt: payload.completed ? new Date() : undefined,
      },
      $inc: { timeSpentSec: payload.timeSpentSec || 0 },
    } as any;

    const doc = await this.bookProgressModel.findOneAndUpdate(
      { userId, bookId },
      update,
      { new: true, upsert: true },
    );

    return doc;
  }

  async getMyBookProgress(bookId: string, userId: string) {
    const doc = await this.bookProgressModel.findOne({ userId, bookId });
    return doc
      ? {
          lastPage: doc.lastPage,
          timeSpentSec: doc.timeSpentSec,
          completed: doc.completed,
        }
      : { lastPage: 0, timeSpentSec: 0, completed: false };
  }

  async getGuideContent(guideId: string) {
    const guide = await this.guideModel.findById(guideId);
    if (!guide) throw new NotFoundException('Guide not found');
    const contentUrl = await this.getPresignedUrlIfNeeded(guide.fileAssetId!);
    this.guideModel
      .updateOne({ _id: guide._id }, { $inc: { 'metrics.views': 1 } })
      .catch(() => {});
    return {
      id: String(guide._id),
      title: guide.title,
      summary: guide.summary,
      description: guide.description,
      authors: guide.authors,
      topics: guide.topics,
      level: guide.level,
      coverUrl: guide.coverUrl,
      language: guide.language,
      contentUrl,
    };
  }

  async getPresentationContent(presentationId: string) {
    const pres = await this.presentationModel.findById(presentationId);
    if (!pres) throw new NotFoundException('Presentation not found');
    const contentUrl = await this.getPresignedUrlIfNeeded(pres.fileAssetId!);
    let posterUrl: string | undefined;
    if (pres.fileAssetId) {
      const asset = await this.assetModel.findById(pres.fileAssetId);
      posterUrl = asset?.urls?.posterUrl;
    }
    this.presentationModel
      .updateOne({ _id: pres._id }, { $inc: { 'metrics.views': 1 } })
      .catch(() => {});
    return {
      id: String(pres._id),
      title: pres.title,
      summary: pres.summary,
      description: pres.description,
      authors: pres.authors,
      topics: pres.topics,
      level: pres.level,
      coverUrl: pres.coverUrl,
      language: pres.language,
      contentUrl,
      posterUrl,
    };
  }
}
