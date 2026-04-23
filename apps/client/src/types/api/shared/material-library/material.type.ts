export interface Material {
  id: string;
  title: string;
  description?: string;
  type: 'book' | 'visual-guide' | 'presentation' | 'document' | 'video' | 'audio';
  url?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  topicId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  isPublished?: boolean;
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
  url?: string;
  fileUrl?: string;
  file?: File;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  topicId?: string;
  isPublished?: boolean;
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
