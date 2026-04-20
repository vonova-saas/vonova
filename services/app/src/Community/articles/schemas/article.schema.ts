import { Schema, Document, Types } from 'mongoose';
import { ContentBlockType } from '../interfaces/content-block.interface';

// Content Block Schema
const ContentBlockSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(ContentBlockType),
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  // Text/Paragraph fields
  content: {
    type: String,
    required: function (this: any) {
      return this.type === ContentBlockType.TEXT ||
        this.type === ContentBlockType.PARAGRAPH ||
        this.type === ContentBlockType.HEADING ||
        this.type === ContentBlockType.QUOTE;
    },
  },
  // Quote specific fields
  author: {
    type: String,
    required: false,
  },
  source: {
    type: String,
    required: false,
  },
  // Code specific fields
  language: {
    type: String,
    required: false,
  },
  code: {
    type: String,
    required: false,
  },
  filename: {
    type: String,
    required: false,
  },
  // Image specific fields
  url: {
    type: String,
    required: false,
  },
  caption: {
    type: String,
    required: false,
  },
  alt: {
    type: String,
    required: false,
  },
  imageKey: {
    type: String,
    required: false,
  },
  // Quote specific fields
  quoteAuthor: {
    type: String,
    required: false,
  },
  quoteSource: {
    type: String,
    required: false,
  },
}, { _id: true, timestamps: false });

// Article Schema
export const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  contentBlocks: {
    type: [ContentBlockSchema],
    required: true,
    validate: {
      validator: function (blocks: any[]) {
        return blocks.length > 0;
      },
      message: 'Article must have at least one content block',
    },
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: {
    type: [String],
    required: true,
    enum: ['architecture', 'devops', 'backend', 'nestjs', 'databases', 'frontend', 'mobile', 'ai', 'security', 'typescript', 'javascript', 'nodejs', 'webdev', 'api', 'microservices'],
    index: true,
  },

  publishedStatus: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  coverImage: {
    type: String,
    required: false,
  },
  coverImageKey: {
    type: String,
    required: false,
  },
  images: {
    type: [String],
    required: false,
  },
  imageKeys: {
    type: [String],
    required: false,
  },
  seoMetadata: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ author: 1, createdAt: -1 });
ArticleSchema.index({ publishedStatus: 1, createdAt: -1 });
ArticleSchema.index({
  title: 'text',
  description: 'text',
  'contentBlocks.content': 'text'
}, {
  name: 'article_text_search',
  default_language: 'english',
  language_override: 'dummy_language_override_field'
});

// Virtual for word count
ArticleSchema.virtual('wordCount').get(function (this: any) {
  return this.contentBlocks.reduce((count: number, block: any) => {
    if (block.content) {
      return count + block.content.split(/\s+/).length;
    }
    return count;
  }, 0);
});

// Pre-save middleware to generate slug if not provided
ArticleSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Interfaces
export interface IArticle {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  contentBlocks: any[];
  author: Types.ObjectId;
  category: string[];
  publishedStatus: 'draft' | 'published' | 'archived';
  coverImage?: string;
  coverImageKey?: string;
  images?: string[];
  imageKeys?: string[];
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  wordCount?: number;
}

export type ArticleDocument = IArticle & Document;
