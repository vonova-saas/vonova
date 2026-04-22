import API from "@/services/axios-client";
import type { 
  Material, 
  MaterialCategory, 
  MaterialStatus,
  CreateMaterialRequest, 
  MaterialsListResponse,
  CreateMaterialResponse,
  DeleteMaterialResponse 
} from "@/types/api/shared/material-library/material.type";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Request Logger Interceptor for debugging (silenced)
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('🔍 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
    });
    return config;
  },
  (error: AxiosError) => {
    console.error('🔍 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Logger Interceptor for debugging (silenced)
API.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('🔍 API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error: AxiosError) => {
    console.error('🔍 API Response Error:', error);
    return Promise.reject(error);
  }
);

// Material API Functions

export const fetchMaterialsQueryFn = async (
  filters?: Partial<MaterialFilters>
): Promise<MaterialsListResponse> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
  }

  const response = await API.get(`/materials?${params.toString()}`);
  return response.data;
};

export const createMaterialMutationFn = async (
  data: CreateMaterialRequest
): Promise<CreateMaterialResponse> => {
  const response = await API.post("/materials", data);
  return response.data;
};

export const updateMaterialMutationFn = async (
  id: string,
  data: UpdateMaterialRequest
): Promise<{ material: Material; message: string }> => {
  const response = await API.put(`/materials/${id}`, data);
  return response.data;
};

export const deleteMaterialMutationFn = async (
  id: string
): Promise<DeleteMaterialResponse> => {
  const response = await API.delete(`/materials/${id}`);
  return response.data;
};

export const getMaterialByIdQueryFn = async (
  id: string
): Promise<Material> => {
  const response = await API.get(`/materials/${id}`);
  return response.data;
};

export const uploadMaterialFileMutationFn = async (
  file: File,
  materialData: Omit<CreateMaterialRequest, 'file'>
): Promise<CreateMaterialResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.entries(materialData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  const response = await API.post("/materials/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMaterialStatsQueryFn = async (): Promise<MaterialStats> => {
  const response = await API.get("/materials/stats");
  return response.data;
};

// Import missing types
import type { UpdateMaterialRequest, MaterialFilters, MaterialStats } from "@/types/api/shared/material-library/material.type";
