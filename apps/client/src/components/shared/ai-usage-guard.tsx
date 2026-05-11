'use client';

import { ReactNode, useCallback } from 'react';
import { useAIMonetization, AIFeature } from '@/hooks/use-ai-monetization';
import { UpgradeModal } from './monetization/upgrade-modal';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface AIUsageGuardProps {
  feature: AIFeature;
  children: ReactNode;
  fallback?: ReactNode;
  onBlocked?: () => void;
}

/**
 * AI Usage Guard
 * 
 * Wraps AI features and automatically:
 * - Checks usage limits before execution
 * - Shows upgrade modal when limit reached
 * - Tracks conversion analytics
 * 
 * Usage:
 * ```tsx
 * <AIUsageGuard feature="ROADMAP_GENERATION">
 *   <RoadmapGenerator />
 * </AIUsageGuard>
 * ```
 */
export function AIUsageGuard({
  feature,
  children,
  fallback,
  onBlocked,
}: AIUsageGuardProps) {
  const {
    showUpgradeModal,
    currentUsage,
    isUpgrading,
    closeUpgradeModal,
    upgradeToPro,
    startTrial,
  } = useAIMonetization();

  const handleUpgrade = useCallback(async () => {
    const url = await upgradeToPro('monthly', currentUsage?.offer?.offerId);
    if (url) {
      window.location.href = url;
    }
  }, [upgradeToPro, currentUsage?.offer?.offerId]);

  const handleStartTrial = useCallback(async () => {
    const success = await startTrial();
    if (success) {
      closeUpgradeModal();
      window.location.reload(); // Refresh to activate Pro
    }
  }, [startTrial, closeUpgradeModal]);

  // If we have a custom fallback and user is blocked, show it
  if (fallback && showUpgradeModal) {
    return (
      <>
        {fallback}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={closeUpgradeModal}
          feature={feature}
          used={currentUsage?.used || 0}
          limit={currentUsage?.limit || 0}
          remaining={currentUsage?.remaining || 0}
          resetAt={currentUsage?.resetAt ? new Date(currentUsage.resetAt) : new Date()}
          offer={currentUsage?.offer}
          trial={currentUsage?.trial}
          onUpgrade={handleUpgrade}
          onStartTrial={handleStartTrial}
        />
      </>
    );
  }

  // Default: show children with upgrade modal overlay when blocked
  return (
    <>
      {children}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeUpgradeModal}
        feature={feature}
        used={currentUsage?.used || 0}
        limit={currentUsage?.limit || 0}
        remaining={currentUsage?.remaining || 0}
        resetAt={currentUsage?.resetAt ? new Date(currentUsage.resetAt) : new Date()}
        offer={currentUsage?.offer}
        trial={currentUsage?.trial}
        onUpgrade={handleUpgrade}
        onStartTrial={handleStartTrial}
      />
    </>
  );
}

/**
 * AI Feature Button
 * 
 * Button that checks usage before triggering action
 */
interface AIFeatureButtonProps {
  feature: AIFeature;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showProBadge?: boolean;
}

export function AIFeatureButton({
  feature,
  onClick,
  children,
  disabled,
  variant = 'default',
  size = 'default',
  className,
  showProBadge = false,
}: AIFeatureButtonProps) {
  const { checkUsage, showUpgradeModal } = useAIMonetization();

  const handleClick = async () => {
    const { allowed } = await checkUsage(feature);
    if (allowed) {
      onClick();
    }
    // If not allowed, checkUsage will show upgrade modal
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || showUpgradeModal}
      variant={variant}
      size={size}
      className={className}
    >
      {showProBadge && <Zap className="w-4 h-4 mr-2 text-yellow-500" />}
      {children}
    </Button>
  );
}
