'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchArticles,
  fetchArticleById,
  fetchArticleBySlug,
  fetchPosts,
  fetchPostsByUser,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  sharePost,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  createReply,
  getReplies,
  type QueryArticlesParams,
  type CreateArticleInput,
  type UpdateArticleInput,
  type CreatePostInput,
} from '@/services/app/community/community.api';

// Query Keys
export const communityKeys = {
  all: ['community'] as const,
  articles: () => [...communityKeys.all, 'articles'] as const,
  article: (id: string) => [...communityKeys.all, 'article', id] as const,
  posts: () => [...communityKeys.all, 'posts'] as const,
  post: (postId: string) => [...communityKeys.all, 'post', postId] as const,
  userPosts: (userId: string) => [...communityKeys.all, 'user-posts', userId] as const,
  comments: (postId: string) => [...communityKeys.all, 'comments', postId] as const,
  replies: (commentId: string) => [...communityKeys.all, 'replies', commentId] as const,
};

// Articles
export const useArticles = (params?: QueryArticlesParams) => {
  return useQuery({
    queryKey: [...communityKeys.articles(), params],
    queryFn: () => fetchArticles(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useArticleById = (id: string) => {
  return useQuery({
    queryKey: communityKeys.article(id),
    queryFn: () => fetchArticleById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: [...communityKeys.articles(), 'slug', slug],
    queryFn: () => fetchArticleBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

// Posts - Infinite Scroll
export const usePosts = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: communityKeys.posts(),
    queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < limit) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePostsByUser = (userId: string, limit = 10) => {
  return useInfiniteQuery({
    queryKey: communityKeys.userPosts(userId),
    queryFn: ({ pageParam = 1 }) => fetchPostsByUser(userId, pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.posts.length < limit) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePostById = (postId: string) => {
  return useQuery({
    queryKey: communityKeys.post(postId),
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
};

// Post Mutations
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: string | CreatePostInput) => createPost(input),
    onSuccess: () => {
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create post');
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: { content?: string; image?: File | null } }) =>
      updatePost(postId, payload),
    onSuccess: (_, variables) => {
      toast.success('Post updated successfully!');
      queryClient.invalidateQueries({ queryKey: communityKeys.post(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update post');
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success('Post deleted successfully!');
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete post');
    },
  });
};

export const useTogglePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePostLike,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to toggle like');
    },
  });
};

export const useSharePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, shareComment }: { postId: string; shareComment?: string }) =>
      sharePost(postId, shareComment),
    onSuccess: () => {
      toast.success('Post shared successfully!');
      queryClient.invalidateQueries({ queryKey: communityKeys.posts() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to share post');
    },
  });
};

// Comments
export const useComments = (postId: string, limit = 20) => {
  return useInfiniteQuery({
    queryKey: communityKeys.comments(postId),
    queryFn: ({ pageParam = 1 }) => fetchComments(postId, pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.comments.length < limit) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!postId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, text, image }: { postId: string; text: string; image?: File }) =>
      createComment(postId, text, image),
    onSuccess: (_, variables) => {
      toast.success('Comment added!');
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.post(variables.postId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add comment');
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, text, image }: { commentId: string; text: string; image?: File }) =>
      updateComment(commentId, text, image),
    onSuccess: () => {
      toast.success('Comment updated!');
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update comment');
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      toast.success('Comment deleted!');
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete comment');
    },
  });
};

export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCommentLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to toggle like');
    },
  });
};

// Replies
export const useReplies = (commentId: string, limit = 5) => {
  return useInfiniteQuery({
    queryKey: communityKeys.replies(commentId),
    queryFn: ({ pageParam = 1 }) => getReplies(commentId, pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.replies.length < limit) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    enabled: !!commentId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, parentCommentId, text, image }: {
      postId: string;
      parentCommentId: string;
      text: string;
      image?: File;
    }) => createReply(postId, parentCommentId, text, image),
    onSuccess: (_, variables) => {
      toast.success('Reply added!');
      queryClient.invalidateQueries({ queryKey: communityKeys.replies(variables.parentCommentId) });
      queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add reply');
    },
  });
};
