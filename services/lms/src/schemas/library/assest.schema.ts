import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


export type LibraryAssetStatus = 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';


export class LibraryAssetUrls {
sourceUrl?: string;
streamUrl?: string;
posterUrl?: string;
previewThumbnails?: string[];
}


@Schema({ timestamps: true })
export class LibraryAsset {
@Prop({ type: Types.ObjectId, ref: 'User', required: true })
ownerId: Types.ObjectId;


@Prop({ enum: ['BOOK', 'GUIDE', 'PRESENTATION'], index: true })
itemType: string;


@Prop({ type: Types.ObjectId, required: true, index: true })
itemId: Types.ObjectId;


@Prop({ default: 'S3' })
provider: string;


@Prop({ required: true })
objectKey: string;


@Prop({ required: true })
originalFileName: string;


@Prop({ required: true })
mimeType: string;


@Prop()
size?: number;


@Prop({ enum: ['PENDING', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED'], default: 'PENDING' })
status: LibraryAssetStatus;


@Prop({ type: Object, default: {} })
urls: LibraryAssetUrls;
}


export type LibraryAssetDocument = LibraryAsset & Document;
export const LibraryAssetSchema = SchemaFactory.createForClass(LibraryAsset);
LibraryAssetSchema.index({ itemType: 1, itemId: 1 });