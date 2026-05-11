'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useCheckPlan } from '@/hooks/app/subscription/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Sparkles } from 'lucide-react';

interface AIUsageGuardProps {
  children: ReactNode;
  feature: 'ARTICLE_GENERATION' | 'PDF_SUMMARY' | 'ROADMAP_GENERATION' | 'VOICE_CHAT' | 'QUIZ_GENERATION' | 'PROBLEM_SOLVING';
  fallback?: ReactNode;
}

export function AIUsageGuard({ children, feature, fallback }: AIUsageGuardProps) {
  const { data, isLoading } = useCheckPlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const plan = data?.data?.plan || 'FREE';
  const limits = data?.data?.limits || {};
  const limit = limits[feature as keyof typeof limits] || 0;
  
  // -1 means unlimited (Pro plan)
  const isUnlimited = limit === -1;
  const isPro = plan === 'PRO';

  // If user has Pro or unlimited access, render children
  if (isPro || isUnlimited) {
    return <>{children}</>;
  }

  // If user has reached their limit, show upgrade prompt
  if (limit === 0) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Daily Limit Reached</CardTitle>
          <CardDescription>
            You've used all your {feature.toLowerCase().replace('_', ' ')} requests for today.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for unlimited access to all AI features.
          </p>
          <Link href="/pricing">
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Your limit will reset tomorrow.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show remaining count for Free users
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Daily usage</span>
        <span>{limit} remaining</span>
      </div>
      {children}
    </div>
  );
}

// Hook to check if user can use a specific AI feature
export function useCanUseAI(feature: keyof AIUsageGuardProps['feature']) {
  const { data, isLoading } = useCheckPlan();
  
  if (isLoading) {
    return { canUse: false, isLoading: true, limit: 0 };
  }

  const plan = data?.data?.plan || 'FREE';
  const limits = data?.data?.limits || {};
  const limit = limits[feature as keyof typeof limits] || 0;
  
  return {
    canUse: plan === 'PRO' || limit === -1 || limit > 0,
    isLoading: false,
    limit,
    isPro: plan === 'PRO',
  };
}
