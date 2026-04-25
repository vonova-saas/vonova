import { communityApi } from "./community.api";

// Types
export interface Author {
  _id: string;
  name: string;
  profilePicture?: string;
}

export interface BaseComment {
  _id: string;
  text: string;
  image?: string;
  author: Author;
  likes: string[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reply extends BaseComment {
  parentComment: string;
}

export interface Comment extends BaseComment {
  replies?: Reply[];
  repliesCount: number;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RepliesResponse {
  replies: Reply[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

// Enhanced Comments API
export const enhancedCommentsApi = {
  // Get comments for a post
  getComments: async (postId: string, page = 1, limit = 10): Promise<CommentsResponse> => {
    const response = await communityApi.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  // Create a new comment
  createComment: async (postId: string, content: string, file?: File): Promise<Comment> => {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    const response = await communityApi.post(`/posts/${postId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Update a comment
  updateComment: async (commentId: string, content: string, file?: File): Promise<Comment> => {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    const response = await communityApi.put(`/posts/comments/${commentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete a comment
  deleteComment: async (commentId: string): Promise<{ deleted: boolean; commentId: string }> => {
    const response = await communityApi.delete(`/posts/comments/${commentId}`);
    return response.data.data;
  },

  // Like/unlike a comment
  toggleCommentLike: async (commentId: string): Promise<LikeResponse> => {
    const response = await communityApi.post(`/posts/comments/${commentId}/like`);
    return response.data.data;
  },

  // Reply to a comment
  createReply: async (postId: string, parentCommentId: string, content: string, file?: File): Promise<Reply> => {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    const response = await communityApi.post(
      `/posts/${postId}/comments/${parentCommentId}/reply`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Get replies for a comment
  getReplies: async (commentId: string, page = 1, limit = 5): Promise<RepliesResponse> => {
    const response = await communityApi.get(`/posts/comments/${commentId}/replies`, {
      params: { page, limit }
    });
    return response.data.data;
  },
};

// React Query hooks for enhanced comments
export const useEnhancedComments = (postId: string, initialPage = 1, initialLimit = 10) => {
  return {
    getCommentsQueryKey: (page = initialPage, limit = initialLimit) => 
      ['community', 'posts', postId, 'comments', page, limit],
    
    getRepliesQueryKey: (commentId: string, page = 1, limit = 5) => 
      ['community', 'comments', commentId, 'replies', page, limit],
  };
};
