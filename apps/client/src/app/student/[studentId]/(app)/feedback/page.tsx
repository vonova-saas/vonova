"use client";

import { FeedbackForm } from '@/components/shared/feedback/feedback-form';
import { FeedbackList } from '@/components/shared/feedback/feedback-list';
import { useAuthContext } from '@/context/app/auth/auth-context';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function FeedbackPage() {
  const { user } = useAuthContext();
  const params = useParams<{ portfolioId: string; feedbackId: string }>();
  const portfolioId = params?.portfolioId || "";
  const userId = useMemo(() => user?._id || portfolioId || "", [user?._id, portfolioId]);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Share Your Feedback</h1>
          <p className="text-muted-foreground">
            We value your input! Let us know how we can improve your experience.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <FeedbackForm />
        </div>

        <FeedbackList />

        <div className="mt-8 rounded-lg border bg-muted/50 p-6 text-center">
          <h3 className="mb-2 text-lg font-medium">Have a quick question?</h3>
          <p className="text-muted-foreground">
            Check out our <a href={`/${userId}/support`} className="text-primary hover:underline">Support Center</a> for answers to common questions.
          </p>
        </div>
      </div>
    </div>
  );
}