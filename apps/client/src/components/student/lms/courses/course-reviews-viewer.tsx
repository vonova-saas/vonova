"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare } from "lucide-react";
import { CourseReview, ReviewsResponse } from "@/types/api/lms/courses.type";
import { getCourseReviewsQueryFn } from "@/services/student/lms/courses/courses.api";
import { cn } from "@/lib/utils";

interface iAppProps {
  courseId: string;
}

export function CourseReviewsViewer({ courseId }: iAppProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        // const data = await getCourseReviewsQueryFn(courseId, { page, limit: 10 });
        // setReviewsData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [courseId, page]);

  if (loading) {
    return <CourseReviewsSkeleton />;
  }

  if (error || !reviewsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">{error || "Reviews not available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Course Reviews
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{reviewsData.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">
                ({reviewsData.totalReviews} reviews)
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsData.reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">No reviews yet</p>
            </CardContent>
          </Card>
        ) : (
          reviewsData.reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))
        )}
      </div>

      {/* Pagination */}
      {reviewsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {reviewsData.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(reviewsData.pagination.totalPages, p + 1))}
            disabled={page === reviewsData.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: CourseReview }) {
  const initials = review.user?.name
    ? review.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="size-12">
            <AvatarImage src={review.user?.avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-4",
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
            {review.title && (
              <p className="font-semibold text-sm">{review.title}</p>
            )}
            {review.body && (
              <p className="text-sm text-muted-foreground">{review.body}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
      </Card>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
