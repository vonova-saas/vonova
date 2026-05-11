'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Users } from 'lucide-react';
import type { Course } from '@/types/api/lms/courses.type';

interface CourseCardProps {
  course: Course;
  progress?: number;
  isEnrolled?: boolean;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function CourseCard({
  course,
  progress = 0,
  isEnrolled = false,
  variant = 'default'
}: CourseCardProps) {
  const isCompact = variant === 'compact';
  const isHorizontal = variant === 'horizontal';

  const thumb =
    course.thumbnailUrl?.trim() ||
    "/images/Dashboard.png";

  const useAwsUnoptimized =
    typeof thumb === "string" && thumb.includes("amazonaws.com");

  const content = (
    <>
      {/* Thumbnail */}
      <div className={`relative overflow-hidden bg-muted ${isHorizontal ? 'w-48 h-32' : 'aspect-video'}`}>
        <Image
          key={thumb}
          src={thumb}
          alt={course.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          unoptimized={useAwsUnoptimized}
        />

        {/* Difficulty Badge */}
        {course.difficulty && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2"
          >
            {course.difficulty}
          </Badge>
        )}

        {/* Price Badge */}
        {course.price && !course.price.isFree ? (
          <Badge
            className="absolute top-2 right-2"
          >
            ${course.price.amount}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2"
          >
            Free
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className={`p-4 ${isHorizontal ? 'flex-1' : ''}`}>
        <h3 className={`font-semibold line-clamp-2 mb-2 ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {course.title}
        </h3>

        {!isCompact && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {course.smallDescription || course.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.enrollmentCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrollmentCount}
            </span>
          )}
          {course.averageRating !== undefined && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {course.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Progress Bar for Enrolled Courses */}
        {isEnrolled && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {!isCompact && (
        <CardFooter className="p-4 pt-0">
          <Button variant={isEnrolled ? 'outline' : 'default'} className="w-full">
            {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
          </Button>
        </CardFooter>
      )}
    </>
  );

  return (
    <Link href={`/courses/${course.slug || course._id}`}>
      <Card className={`overflow-hidden h-full transition-shadow hover:shadow-lg ${isHorizontal ? 'flex' : ''}`}>
        {content}
      </Card>
    </Link>
  );
}
