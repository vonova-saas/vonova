import { Types } from 'mongoose';

// Content block types
export enum ContentBlockType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE = 'code',
  IMAGE = 'image',
  QUOTE = 'quote',
}

// Base content block interface
export interface IContentBlock {
  _id?: Types.ObjectId;
  type: ContentBlockType;
  order: number;
}

// Paragraph content block
export interface IParagraphBlock extends IContentBlock {
  type: ContentBlockType.PARAGRAPH;
  content: string;
}

// Heading content block
export interface IHeadingBlock extends IContentBlock {
  type: ContentBlockType.HEADING;
  content: string;
}

// Code content block
export interface ICodeBlock extends IContentBlock {
  type: ContentBlockType.CODE;
  language: string;
  code: string;
  filename?: string;
}

// Image content block
export interface IImageBlock extends IContentBlock {
  type: ContentBlockType.IMAGE;
  url: string;
  caption?: string;
  alt?: string;
  imageKey?: string; // AWS S3 key
}

// Quote content block
export interface IQuoteBlock extends IContentBlock {
  type: ContentBlockType.QUOTE;
  content: string;
  quoteAuthor?: string;
  quoteSource?: string;
}

// Union type for all content blocks
export type ContentBlock = 
  | IParagraphBlock 
  | IHeadingBlock 
  | ICodeBlock 
  | IImageBlock 
  | IQuoteBlock;
