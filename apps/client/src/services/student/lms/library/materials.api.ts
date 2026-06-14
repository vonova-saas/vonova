import API from "@/services/axios-client";

// Types
export interface Material {
  _id: string;
  title: string;
  description?: string;
  type: 'BOOK' | 'PRESENTATION' | 'GUIDE' | 'VIDEO';
  visibility: 'PUBLIC' | 'PRIVATE';
  price: number;
  currency: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  ownerId: string;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsResponse {
  message: string;
  data: {
    items: Material[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MaterialAccessResponse {
  message: string;
  data: {
    hasAccess: boolean;
    purchaseRequired: boolean;
    price?: number;
    canPreview: boolean;
  };
}

export interface PurchaseResponse {
  message: string;
  data: {
    paymentId: string;
    status: string;
    checkoutUrl?: string;
  };
}

// Browse Materials
export const getAllMaterialsQueryFn = async (
  params?: { page?: number; limit?: number; type?: string; search?: string }
): Promise<MaterialsResponse> => {
  const response = await API.get('/api/v1/lms/library/materials', { params });
  return response.data;
};

export const getMaterialByIdQueryFn = async (materialId: string): Promise<{ message: string; data: Material }> => {
  const response = await API.get(`/api/v1/lms/library/materials/${materialId}`);
  return response.data;
};

// Access Control
export const checkMaterialAccessQueryFn = async (materialId: string): Promise<MaterialAccessResponse> => {
  const response = await API.get(`/api/v1/lms/library/materials/${materialId}/access`);
  return response.data;
};

// Purchase
export const purchaseMaterialMutationFn = async (materialId: string): Promise<PurchaseResponse> => {
  const response = await API.post(`/api/v1/lms/library/materials/${materialId}/purchase`);
  return response.data;
};

/** Matches LMS / gateway `library/favorite` (BOOK | GUIDE | PRESENTATION only). */
export type LibraryFavoriteItemType = "BOOK" | "GUIDE" | "PRESENTATION";

const LIBRARY_FAVORITE_BASE = "/api/v1/lms/library/favorite";

// Favorites — gateway: GET …/favorite/me, toggle: POST …/favorite/:itemType/:itemId
export const getMyFavoritesQueryFn = async (): Promise<{
  message: string;
  data: Array<{ itemType: LibraryFavoriteItemType; itemId: string }>;
}> => {
  const response = await API.get(`${LIBRARY_FAVORITE_BASE}/me`);
  return response.data;
};

export const toggleLibraryFavoriteMutationFn = async (input: {
  materialId: string;
  itemType: LibraryFavoriteItemType;
}): Promise<{ message: string; data: { favorited: boolean } }> => {
  const { materialId, itemType } = input;
  const response = await API.post(
    `${LIBRARY_FAVORITE_BASE}/${itemType}/${encodeURIComponent(materialId)}`,
  );
  return response.data;
};

/** @deprecated Use {@link toggleLibraryFavoriteMutationFn} — favorites are toggled via POST, not DELETE. */
export const addToFavoritesMutationFn = toggleLibraryFavoriteMutationFn;

/** @deprecated Use {@link toggleLibraryFavoriteMutationFn} — removal is the same toggle endpoint. */
export const removeFromFavoritesMutationFn = toggleLibraryFavoriteMutationFn;

// Reader
export const getReaderContentQueryFn = async (materialId: string): Promise<{ message: string; data: { content: string; metadata: any } }> => {
  const response = await API.get(`/api/v1/lms/library/materials/${materialId}/reader`);
  return response.data;
};
