'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Sparkles, Zap, Crown, X } from 'lucide-react';
import { useCountdown } from '@/hooks/use-countdown';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  offer?: {
    offerId: string;
    discountPercent: number;
    originalPrice: number;
    discountedPrice: number;
    expiresAt: Date;
    features: string[];
    badge: string;
  };
  trial?: {
    isActive: boolean;
    daysRemaining: number;
    canStart: boolean;
    hasUsedBefore: boolean;
  };
  onUpgrade: () => void;
  onStartTrial: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  used,
  limit,
  resetAt,
  offer,
  trial,
  onUpgrade,
  onStartTrial,
}: UpgradeModalProps) {
  const [isTrialLoading, setIsTrialLoading] = useState(false);
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  const offerTimeLeft = useCountdown(offer?.expiresAt || new Date());
  const resetTimeLeft = useCountdown(resetAt);

  const featureNames: Record<string, string> = {
    ROADMAP_GENERATION: 'Roadmap Generation',
    PDF_SUMMARY: 'PDF Summary',
    VOICE_CHAT: 'Voice Chat',
    ARTICLE_GENERATION: 'Article Generation',
    QUIZ_GENERATION: 'Quiz Generation',
    PROBLEM_SOLVING: 'Problem Solving',
  };

  const handleStartTrial = async () => {
    setIsTrialLoading(true);
    await onStartTrial();
    setIsTrialLoading(false);
  };

  const handleUpgrade = async () => {
    setIsUpgradeLoading(true);
    await onUpgrade();
    setIsUpgradeLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Daily Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            You've used {used} of {limit} {featureNames[feature]} today.
          </DialogDescription>
        </DialogHeader>

        {/* Usage Progress */}
        <div className="py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Daily Usage</span>
            <span className="font-medium">{used} / {limit}</span>
          </div>
          <Progress value={(used / limit) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Resets in {resetTimeLeft?.hours}h {resetTimeLeft?.minutes}m
          </p>
        </div>

        {/* Limited Time Offer */}
        {offer && (
          <Card className="p-4 border-primary/50 bg-primary/5 relative overflow-hidden">
            <Badge className="absolute top-2 right-2 bg-primary">
              {offer.badge}
            </Badge>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold">${offer.discountedPrice}</span>
              <span className="text-lg text-muted-foreground line-through">${offer.originalPrice}</span>
              <Badge variant="secondary">{offer.discountPercent}% OFF</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Offer expires in:{' '}
              <span className="font-mono font-medium text-primary">
                {offerTimeLeft?.minutes}:{offerTimeLeft?.seconds.toString().padStart(2, '0')}
              </span>
            </p>
            <ul className="space-y-1 text-sm">
              {offer.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {feat}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Free vs Pro Comparison */}
        <div className="grid grid-cols-2 gap-4 py-4">
          <Card className="p-4 opacity-60">
            <div className="flex items-center gap-2 mb-3">
              <X className="h-4 w-4" />
              <span className="font-medium">Free Plan</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">• {limit} generations/day</li>
              <li className="text-muted-foreground">• Standard speed</li>
              <li className="text-muted-foreground">• Basic features</li>
            </ul>
          </Card>

          <Card className="p-4 border-primary">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-medium">Pro Plan</span>
              <Badge className="ml-auto">Best Value</Badge>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                Unlimited generations
              </li>
              <li className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                Priority processing
              </li>
              <li className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                All premium features
              </li>
            </ul>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Upgrade Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpgrade}
            disabled={isUpgradeLoading}
          >
            {isUpgradeLoading ? (
              <span className="animate-pulse">Processing...</span>
            ) : offer ? (
              <>
                Claim {offer.discountPercent}% Off - ${offer.discountedPrice}/mo
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </>
            )}
          </Button>

          {/* Trial Button */}
          {trial?.canStart && !trial?.isActive && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleStartTrial}
              disabled={isTrialLoading}
            >
              {isTrialLoading ? (
                <span className="animate-pulse">Starting...</span>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start 7-Day Free Trial
                </>
              )}
            </Button>
          )}

          {/* Trial Active */}
          {trial?.isActive && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Pro trial active! {trial.daysRemaining} days remaining.
              </p>
            </div>
          )}

          {/* Close Button */}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Continue with Free Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
