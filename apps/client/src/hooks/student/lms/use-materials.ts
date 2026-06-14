'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllMaterialsQueryFn,
  getMaterialByIdQueryFn,
  checkMaterialAccessQueryFn,
  purchaseMaterialMutationFn,
  getMyFavoritesQueryFn,
  toggleLibraryFavoriteMutationFn,
  type LibraryFavoriteItemType,
  getReaderContentQueryFn,
} from '@/services/student/lms/library/materials.api';
import { S3_PRESIGNED_QUERY_STALE_MS, S3_PRESIGNED_QUERY_STALE_NEVER } from "@/lib/lms/presigned-url";

const MATERIAL_GC_MS = S3_PRESIGNED_QUERY_STALE_MS + 15 * 60 * 1000;

// Query Keys
export const materialsKeys = {
  all: ['materials'] as const,
  lists: () => [...materialsKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...materialsKeys.lists(), filters] as const,
  details: () => [...materialsKeys.all, 'detail'] as const,
  detail: (materialId: string) => [...materialsKeys.details(), materialId] as const,
  access: (materialId: string) => [...materialsKeys.all, 'access', materialId] as const,
  favorites: () => [...materialsKeys.all, 'favorites'] as const,
  reader: (materialId: string) => [...materialsKeys.all, 'reader', materialId] as const,
};

// Browse Materials
export const useAllMaterials = (params?: { page?: number; limit?: number; type?: string; search?: string }) => {
  return useQuery({
    queryKey: materialsKeys.list(params || {}),
    queryFn: () => getAllMaterialsQueryFn(params),
    staleTime: S3_PRESIGNED_QUERY_STALE_MS,
    gcTime: MATERIAL_GC_MS,
  });
};

export const useMaterialById = (materialId: string) => {
  return useQuery({
    queryKey: materialsKeys.detail(materialId),
    queryFn: () => getMaterialByIdQueryFn(materialId),
    enabled: !!materialId,
    staleTime: S3_PRESIGNED_QUERY_STALE_NEVER,
    gcTime: MATERIAL_GC_MS,
  });
};

// Access Control
export const useMaterialAccess = (materialId: string) => {
  return useQuery({
    queryKey: materialsKeys.access(materialId),
    queryFn: () => checkMaterialAccessQueryFn(materialId),
    enabled: !!materialId,
  });
};

// Purchase
export const usePurchaseMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseMaterialMutationFn,
    onSuccess: (data, materialId) => {
      toast.success('Redirecting to payment...');
      // If Stripe checkout URL is provided, redirect
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast.success('Material purchased successfully!');
        queryClient.invalidateQueries({ queryKey: materialsKeys.access(materialId) });
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to purchase material');
    },
  });
};

// Favorites
export const useMyFavorites = () => {
  return useQuery({
    queryKey: materialsKeys.favorites(),
    queryFn: getMyFavoritesQueryFn,
  });
};

export type ToggleFavoriteInput = {
  materialId: string;
  itemType: LibraryFavoriteItemType;
};

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLibraryFavoriteMutationFn,
    onSuccess: (res) => {
      toast.success(
        res.data?.favorited ? 'Added to favorites!' : 'Removed from favorites',
      );
      queryClient.invalidateQueries({ queryKey: materialsKeys.favorites() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update favorites');
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLibraryFavoriteMutationFn,
    onSuccess: (res) => {
      toast.success(
        res.data?.favorited ? 'Added to favorites!' : 'Removed from favorites',
      );
      queryClient.invalidateQueries({ queryKey: materialsKeys.favorites() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update favorites');
    },
  });
};

// Reader
// Reader: may embed presigned asset URLs — never treat cached payload as fresh after TTL.
export const useReaderContent = (materialId: string) => {
  return useQuery({
    queryKey: materialsKeys.reader(materialId),
    queryFn: () => getReaderContentQueryFn(materialId),
    enabled: !!materialId,
    staleTime: S3_PRESIGNED_QUERY_STALE_NEVER,
    gcTime: MATERIAL_GC_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
};
