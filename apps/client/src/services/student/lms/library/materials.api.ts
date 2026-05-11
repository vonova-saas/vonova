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

// Favorites
export const getMyFavoritesQueryFn = async (): Promise<{ message: string; data: Material[] }> => {
  const response = await API.get('/api/v1/lms/library/favorites');
  return response.data;
};

export const addToFavoritesMutationFn = async (materialId: string): Promise<{ message: string; data: any }> => {
  const response = await API.post(`/api/v1/lms/library/favorites`, { materialId });
  return response.data;
};

export const removeFromFavoritesMutationFn = async (materialId: string): Promise<{ message: string; data: any }> => {
  const response = await API.delete(`/api/v1/lms/library/favorites/${materialId}`);
  return response.data;
};

// Reader
export const getReaderContentQueryFn = async (materialId: string): Promise<{ message: string; data: { content: string; metadata: any } }> => {
  const response = await API.get(`/api/v1/lms/library/materials/${materialId}/reader`);
  return response.data;
};
