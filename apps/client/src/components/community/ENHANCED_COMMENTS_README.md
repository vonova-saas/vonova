# Enhanced Comment System Documentation

## Overview

This enhanced comment system provides a LinkedIn-style commenting experience with nested replies, likes, and image support. It's built with scalability and performance in mind.

## Features

### ✅ **Core Features**
- **Nested Comments**: Support for 2-level nesting (comments → replies)
- **Like System**: Users can like/unlike comments and replies
- **Image Support**: Attach images to comments and replies
- **Real-time Updates**: Optimistic updates with proper error handling
- **Pagination**: Efficient loading for both comments and replies
- **Responsive Design**: Mobile-friendly LinkedIn-style UI

### ✅ **User Experience**
- **LinkedIn-style UI**: Clean, professional interface
- **Keyboard Shortcuts**: Support for common interactions
- **Loading States**: Proper skeleton loading and feedback
- **Error Handling**: Graceful error recovery
- **Accessibility**: Full ARIA support and keyboard navigation

## Backend Implementation

### Schema Updates

```typescript
// Enhanced Comment Schema
@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  text: string;
  
  @Prop({ type: String, default: null })
  image?: string;

  @Prop({ type: String, default: null })
  imageKey?: string;

  // NEW: Reply support
  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentComment?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }], default: [] })
  replies: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0 })
  repliesCount: number;

  // Existing like support
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0 })
  likesCount: number;
}
```

### New API Endpoints

#### Reply Management
- `POST /:postId/comments/:commentId/reply` - Create reply to comment
- `GET /comments/:commentId/replies` - Get paginated replies

#### Like Management
- `POST /comments/:commentId/like` - Toggle like on comment

### Service Methods

```typescript
// Reply creation
async createReply(
  parentCommentId: string, 
  postId: string, 
  userId: string, 
  dto: CreateCommentDto
)

// Reply retrieval
async getRepliesByComment(
  parentCommentId: string, 
  page: number = 1, 
  limit: number = 5
)

// Like toggling
async toggleCommentLike(commentId: string, userId: string)
```

## Frontend Implementation

### Components

#### `EnhancedCommentSection`
Main component that handles the entire comment system:

```tsx
<EnhancedCommentSection
  postId={postId}
  comments={comments}
  currentUserId={currentUserId}
  onCreateComment={handleCreateComment}
  onReplyToComment={handleReplyToComment}
  onLikeComment={handleLikeComment}
  onUpdateComment={handleUpdateComment}
  onDeleteComment={handleDeleteComment}
  onLoadMoreReplies={handleLoadMoreReplies}
  isLoading={isLoading}
/>
```

#### Features
- **Nested Comments**: Visual hierarchy with indentation
- **Reply Input**: Inline reply forms for each comment
- **Like Button**: Heart icon with count and animation
- **Image Upload**: Drag & drop or click to upload
- **Load More**: Pagination for long reply threads

### API Service

#### `enhancedCommentsApi`
Complete API integration with TypeScript support:

```typescript
// Get comments
const comments = await enhancedCommentsApi.getComments(postId);

// Create comment with image
const comment = await enhancedCommentsApi.createComment(
  postId, 
  content, 
  imageFile
);

// Reply to comment
const reply = await enhancedCommentsApi.createReply(
  postId, 
  parentCommentId, 
  replyContent, 
  replyImage
);

// Toggle like
const result = await enhancedCommentsApi.toggleCommentLike(commentId);
```

## Usage Examples

### Basic Implementation

```tsx
import { EnhancedCommentSection } from "@/components/community/enhanced-comment-section";
import { enhancedCommentsApi } from "@/services/app/community/enhanced-comments.api";

function PostComments({ postId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateComment = async (content: string, file?: File) => {
    const newComment = await enhancedCommentsApi.createComment(
      postId, 
      content, 
      file
    );
    setComments(prev => [newComment, ...prev]);
  };

  const handleReplyToComment = async (parentCommentId: string, content: string, file?: File) => {
    const reply = await enhancedCommentsApi.createReply(
      postId, 
      parentCommentId, 
      content, 
      file
    );
    // Update parent comment with new reply
    setComments(prev => prev.map(comment => 
      comment._id === parentCommentId 
        ? { ...comment, replies: [reply, ...(comment.replies || [])] }
        : comment
    ));
  };

  const handleLikeComment = async (commentId: string) => {
    const result = await enhancedCommentsApi.toggleCommentLike(commentId);
    // Update like status in UI
    setComments(prev => prev.map(comment => 
      comment._id === commentId 
        ? { ...comment, likesCount: result.likesCount }
        : comment
    ));
  };

  return (
    <EnhancedCommentSection
      postId={postId}
      comments={comments}
      currentUserId={currentUserId}
      onCreateComment={handleCreateComment}
      onReplyToComment={handleReplyToComment}
      onLikeComment={handleLikeComment}
    />
  );
}
```

### React Query Integration

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enhancedCommentsApi, useEnhancedComments } from "@/services/app/community/enhanced-comments.api";

function PostCommentsWithQuery({ postId, currentUserId }) {
  const queryClient = useQueryClient();
  const { getCommentsQueryKey } = useEnhancedComments(postId);

  const { data: commentsData, isLoading } = useQuery({
    queryKey: getCommentsQueryKey(),
    queryFn: () => enhancedCommentsApi.getComments(postId),
  });

  const createCommentMutation = useMutation({
    mutationFn: ({ content, file }: { content: string; file?: File }) =>
      enhancedCommentsApi.createComment(postId, content, file),
    onSuccess: (newComment) => {
      queryClient.setQueryData(getCommentsQueryKey(), (old: any) => ({
        ...old,
        comments: [newComment, ...old.comments],
      }));
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: enhancedCommentsApi.toggleCommentLike,
    onSuccess: (result, commentId) => {
      queryClient.setQueryData(getCommentsQueryKey(), (old: any) => ({
        ...old,
        comments: old.comments.map((comment: any) =>
          comment._id === commentId
            ? { ...comment, likesCount: result.likesCount }
            : comment
        ),
      }));
    },
  });

  return (
    <EnhancedCommentSection
      postId={postId}
      comments={commentsData?.comments || []}
      currentUserId={currentUserId}
      onCreateComment={(content, file) => 
        createCommentMutation.mutate({ content, file })
      }
      onLikeComment={(commentId) => 
        likeCommentMutation.mutate(commentId)
      }
      isLoading={isLoading}
    />
  );
}
```

## Performance Optimizations

### Backend
- **Database Indexes**: Optimized queries for comments and replies
- **Population Strategy**: Efficient nested population with limits
- **Pagination**: Prevents loading entire comment threads

### Frontend
- **Optimistic Updates**: Immediate UI feedback
- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Load replies only when needed
- **Image Compression**: Client-side image optimization

### Database Indexes

```typescript
// Performance indexes
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ parentComment: 1, createdAt: -1 });
CommentSchema.index({ post: 1, parentComment: 1 });
```

## Security Considerations

### Input Validation
- Content length limits (1000 characters)
- File type and size validation
- XSS protection for user content

### Authorization
- Only authors can edit/delete their comments
- Post authors can moderate comments
- Admin override capabilities

### Rate Limiting
- Comment creation limits
- Like spam prevention
- File upload restrictions

## Mobile Responsiveness

The component is fully responsive with:
- **Touch-friendly** buttons and inputs
- **Adaptive layouts** for different screen sizes
- **Optimized scrolling** for long comment threads
- **Keyboard support** for accessibility

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Mobile browsers**: iOS Safari, Chrome Mobile
- **Features used**: ES6+, CSS Grid, Flexbox

## Future Enhancements

### Planned Features
- **Real-time updates** with WebSocket
- **Mention users** with @mentions
- **Rich text editor** with formatting
- **Comment threading** beyond 2 levels
- **Comment moderation** tools
- **Analytics** for engagement tracking

### Scalability
- **Caching strategy** with Redis
- **CDN integration** for images
- **Database sharding** for large datasets
- **Microservice architecture** preparation

## Troubleshooting

### Common Issues

1. **Comments not loading**: Check API endpoints and network connectivity
2. **Images not uploading**: Verify file size limits and S3 configuration
3. **Likes not updating**: Ensure user authentication is working
4. **Replies not nesting**: Check parentComment reference in database

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=comments:* npm run dev
```

## Contributing

When contributing to the comment system:

1. **Test all interactions** (create, reply, like, delete)
2. **Check mobile responsiveness**
3. **Verify accessibility** with screen readers
4. **Performance test** with large comment threads
5. **Update documentation** for new features

## License

This enhanced comment system is part of the main project license.
