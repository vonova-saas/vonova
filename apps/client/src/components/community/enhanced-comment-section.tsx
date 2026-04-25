"use client";

import { useState, useCallback } from "react";
import { Heart, MessageCircle, MoreHorizontal, Send, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Types
interface Author {
  _id: string;
  name: string;
  profilePicture?: string;
}

interface BaseComment {
  _id: string;
  text: string;
  image?: string;
  author: Author;
  likes: string[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Reply extends BaseComment {
  parentComment: string;
}

interface Comment extends BaseComment {
  replies?: Reply[];
  repliesCount: number;
}

interface EnhancedCommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  onCreateComment: (content: string, file?: File) => Promise<void>;
  onReplyToComment: (parentCommentId: string, content: string, file?: File) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<{ liked: boolean; likesCount: number }>;
  onUpdateComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLoadMoreReplies?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export function EnhancedCommentSection({
  postId,
  comments,
  currentUserId,
  onCreateComment,
  onReplyToComment,
  onLikeComment,
  onUpdateComment,
  onDeleteComment,
  onLoadMoreReplies,
  isLoading = false,
}: EnhancedCommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [commentImages, setCommentImages] = useState<{ [key: string]: File }>({});
  const [replyImages, setReplyImages] = useState<{ [key: string]: File }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onCreateComment(newComment.trim(), commentImages.main);
      setNewComment("");
      setCommentImages({});
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, commentImages.main, isSubmitting, onCreateComment]);

  const handleSubmitReply = useCallback(async (parentCommentId: string) => {
    const content = replyContent[parentCommentId];
    if (!content?.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onReplyToComment(parentCommentId, content.trim(), replyImages[parentCommentId]);
      setReplyContent(prev => ({ ...prev, [parentCommentId]: "" }));
      setReplyImages(prev => ({ ...prev, [parentCommentId]: undefined as any }));
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [replyContent, replyImages, isSubmitting, onReplyToComment]);

  const handleLikeComment = useCallback(async (commentId: string) => {
    try {
      await onLikeComment(commentId);
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  }, [onLikeComment]);

  const handleImageSelect = useCallback((commentId: string, file: File) => {
    if (commentId === "main") {
      setCommentImages(prev => ({ ...prev, main: file }));
    } else {
      setReplyImages(prev => ({ ...prev, [commentId]: file }));
    }
  }, []);

  const CommentItem = ({ 
    comment, 
    isReply = false, 
    parentCommentId 
  }: { 
    comment: Comment | Reply; 
    isReply?: boolean; 
    parentCommentId?: string;
  }) => {
    const isLiked = comment.likes.includes(currentUserId);
    const isAuthor = comment.author._id === currentUserId;
    const showReplyInput = replyingTo === comment._id;
    const hasReplies = !isReply && "replies" in comment && comment.replies && comment.replies.length > 0;

    return (
      <div className={cn("space-y-3", isReply && "ml-12 border-l-2 border-muted pl-4")}>
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            {comment.author.profilePicture ? (
              <AvatarImage 
                src={comment.author.profilePicture} 
                alt={comment.author.name}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback>{comment.author.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            {/* Comment Content */}
            <p className="text-sm leading-relaxed">{comment.text}</p>
            
            {/* Comment Image */}
            {comment.image && (
              <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
                <img
                  src={comment.image}
                  alt="Comment image"
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            
            {/* Comment Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs",
                  isLiked && "text-red-500 hover:text-red-600"
                )}
                onClick={() => handleLikeComment(comment._id)}
              >
                <Heart className={cn("h-3 w-3 mr-1", isLiked && "fill-current")} />
                {comment.likesCount > 0 && comment.likesCount}
              </Button>
              
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              
              {isAuthor && (
                <div className="flex items-center gap-1">
                  {onUpdateComment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                  {onDeleteComment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => onDeleteComment?.(comment._id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Reply Input */}
        {showReplyInput && (
          <div className="ml-11 space-y-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent[comment._id] || ""}
                onChange={(e) => setReplyContent(prev => ({ 
                  ...prev, 
                  [comment._id]: e.target.value 
                }))}
                className="min-h-[60px] resize-none text-sm"
                rows={2}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(comment._id, file);
                  }}
                  className="hidden"
                  id={`reply-image-${comment._id}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => document.getElementById(`reply-image-${comment._id}`)?.click()}
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {replyImages[comment._id] ? "Change" : "Add"} Image
                </Button>
                {replyImages[comment._id] && (
                  <span className="text-xs text-muted-foreground">
                    {replyImages[comment._id].name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent(prev => ({ ...prev, [comment._id]: "" }));
                    setReplyImages(prev => ({ ...prev, [comment._id]: undefined as any }));
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={!replyContent[comment._id]?.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {hasReplies && (
          <div className="space-y-3">
            {(comment as Comment).replies?.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                isReply={true}
                parentCommentId={comment._id}
              />
            ))}
            
            {/* Load More Replies */}
            {(comment as Comment).repliesCount > ((comment as Comment).replies?.length || 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-11 h-8 px-2 text-xs text-muted-foreground"
                onClick={() => onLoadMoreReplies?.(comment._id)}
              >
                Load {((comment as Comment).repliesCount || 0) - ((comment as Comment).replies?.length || 0)} more replies
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect("main", file);
                  }}
                  className="hidden"
                  id="comment-image-main"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("comment-image-main")?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {commentImages.main ? "Change" : "Add"} Image
                </Button>
                {commentImages.main && (
                  <span className="text-sm text-muted-foreground">
                    {commentImages.main.name}
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
