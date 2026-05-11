'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  FileX, 
  Search, 
  BookOpen, 
  MessageSquare, 
  GraduationCap, 
  Library,
  AlertCircle,
  Inbox
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

// Predefined Empty States
export function EmptyCourses() {
  return (
    <EmptyState
      title="No courses found"
      description="Explore our catalog and start learning today."
      icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
      action={{ label: 'Browse Courses', href: '/courses' }}
    />
  );
}

export function EmptyMaterials() {
  return (
    <EmptyState
      title="No materials available"
      description="Check back later for new learning materials."
      icon={<Library className="h-8 w-8 text-muted-foreground" />}
      action={{ label: 'Browse Materials', href: '/materials' }}
    />
  );
}

export function EmptyPosts() {
  return (
    <EmptyState
      title="No posts yet"
      description="Be the first to share something with the community."
      icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
      action={{ label: 'Create Post', href: '/community/new' }}
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords.`}
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
    />
  );
}

export function EmptyEnrollments() {
  return (
    <EmptyState
      title="Not enrolled in any courses"
      description="Start your learning journey by enrolling in a course."
      icon={<GraduationCap className="h-8 w-8 text-muted-foreground" />}
      action={{ label: 'Browse Courses', href: '/courses' }}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      title="No notifications"
      description="You're all caught up! Check back later for updates."
      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
    />
  );
}

export function ErrorState({ 
  message = "Something went wrong. Please try again.",
  retry 
}: { 
  message?: string;
  retry?: () => void;
}) {
  return (
    <EmptyState
      title="Oops!"
      description={message}
      icon={<AlertCircle className="h-8 w-8 text-destructive" />}
      action={retry ? { label: 'Try Again', onClick: retry } : undefined}
    />
  );
}

export function NotFoundState({ 
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved."
}: { 
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<FileX className="h-8 w-8 text-muted-foreground" />}
      action={{ label: 'Go Home', href: '/' }}
    />
  );
}
