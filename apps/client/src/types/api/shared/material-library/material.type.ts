export type MaterialVisibility = 'PUBLIC' | 'PRIVATE';

export interface Material {
  id: string;
  _id?: string;  // MongoDB format from backend
  title: string;
  description?: string;
  type: 'book' | 'visual-guide' | 'presentation' | 'document' | 'video' | 'audio';
  url?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  topicId?: string;
  topics?: string[];
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  isPublished?: boolean;
  /**
   * Public materials show in the global Material Library.
   * Private materials are limited to students enrolled in the
   * `courseId` they were created under.
   */
  visibility?: MaterialVisibility;
  courseId?: string | null;
  lessonId?: string | null;
  downloadCount?: number;
  viewCount?: number;
}

export interface MaterialLibrary {
  id: string;
  name: string;
  description?: string;
  materials: Material[];
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  ownerId?: string;
}

export interface CreateMaterialRequest {
  title: string;
  description?: string;
  type: Material['type'];
  authorName?: string;
  authors?: Array<{ name: string; avatarUrl?: string }>;
  url?: string;
  fileUrl?: string;
  file?: File;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  topicId?: string;
  topics?: string[];
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  isPublished?: boolean;
  /** PUBLIC = global library; PRIVATE = course-only (requires `courseId`). */
  visibility?: MaterialVisibility;
  /** When set, the material is scoped to the course (and only enrolled students can access it). */
  courseId?: string;
  /** Optional lesson scope for analytics/back-references. */
  lessonId?: string;
}

export interface UpdateMaterialRequest {
  title?: string;
  description?: string;
  type?: Material['type'];
  url?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  topicId?: string;
  isPublished?: boolean;
}

export interface MaterialFilters {
  type?: Material['type'];
  category?: string;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
}

export interface MaterialLibraryResponse {
  materials: Material[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MaterialStats {
  totalMaterials: number;
  totalCategories: number;
  totalDownloads: number;
}

export enum MaterialCategory {
  BOOK = 'book',
  VISUAL_GUIDE = 'visual-guide',
  PRESENTATION = 'presentation',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export enum MaterialStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export interface MaterialsListResponse {
  materials: Material[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  message?: string;
}

export interface CreateMaterialResponse {
  material: Material;
  message: string;
}

export interface DeleteMaterialResponse {
  message: string;
  success: boolean;
}

export interface UploadFileResponse {
  message: string;
  presignedUrl: string;
  fileUrl: string;
  objectKey: string;
  size: number;
  assetId: string;
  fileName: string;
  mimeType: string;
  expiresInSeconds: number;
}
