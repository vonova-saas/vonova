'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export type AIFeature =
  | 'ROADMAP_GENERATION'
  | 'PDF_SUMMARY'
  | 'VOICE_CHAT'
  | 'ARTICLE_GENERATION'
  | 'QUIZ_GENERATION'
  | 'PROBLEM_SOLVING';

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
  isPro: boolean;
  upgradeCTA?: {
    title: string;
    description: string;
    features: string[];
    buttonText: string;
    price: string;
    priceNote: string;
  };
  offer?: {
    offerId: string;
    discountPercent: number;
    expiresAt: Date;
    originalPrice: number;
    discountedPrice: number;
    features: string[];
    badge: string;
  };
  trial?: {
    isActive: boolean;
    daysRemaining: number;
    canStart: boolean;
    hasUsedBefore: boolean;
  };
}

export interface UpgradeResponse {
  sessionId: string;
  url: string;
}

/**
 * useAIMonetization Hook
 * 
 * Manages AI usage limits and upgrade flows
 */
export function useAIMonetization() {
  const [isChecking, setIsChecking] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<UsageCheckResult | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  /**
   * Check AI usage before executing feature
   * Returns true if allowed, false if upgrade needed
   */
  const checkUsage = useCallback(async (
    feature: AIFeature
  ): Promise<{ allowed: boolean; data?: UsageCheckResult }> => {
    setIsChecking(true);
    try {
      const response = await api.post('/ai/check-usage', { feature });
      const data = response.data;

      if (data.allowed) {
        return { allowed: true, data };
      }

      // Transform API response to match expected types
      const transformedData: UsageCheckResult = {
        ...data,
        offer: data.offer ? {
          ...data.offer,
          expiresAt: new Date(data.offer.expiresAt),
          features: data.offer.features || ['Unlimited AI', 'Priority support', 'Advanced analytics'],
          badge: data.offer.badge || 'Limited Offer',
        } : undefined,
        trial: data.trial ? {
          isActive: data.trial.available || false,
          daysRemaining: data.trial.durationDays || 7,
          canStart: data.trial.available && !data.trial.hasUsedBefore,
          hasUsedBefore: data.trial.hasUsedBefore || false,
        } : undefined,
      };

      // Show upgrade modal
      setCurrentUsage(transformedData);
      setShowUpgradeModal(true);
      return { allowed: false, data: transformedData };
    } catch (error: any) {
      console.error('Usage check failed:', error);
      // Fail open for better UX (let them try)
      return { allowed: true };
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Start Stripe checkout for upgrade
   */
  const upgradeToPro = useCallback(async (
    interval: 'monthly' | 'yearly' = 'monthly',
    offerId?: string
  ): Promise<string | null> => {
    setIsUpgrading(true);
    try {
      const response = await api.post('/payments/create-checkout', {
        interval,
        offerId,
      });

      if (response.data.success) {
        return response.data.data.url;
      }
      return null;
    } catch (error: any) {
      console.error('Upgrade failed:', error);
      return null;
    } finally {
      setIsUpgrading(false);
    }
  }, []);

  /**
   * Start 7-day free trial
   */
  const startTrial = useCallback(async (): Promise<boolean> => {
    setIsUpgrading(true);
    try {
      const response = await api.post('/payments/start-trial');
      return response.data.success;
    } catch (error: any) {
      console.error('Trial start failed:', error);
      return false;
    } finally {
      setIsUpgrading(false);
    }
  }, []);

  /**
   * Close upgrade modal
   */
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setCurrentUsage(null);
  }, []);

  return {
    // State
    isChecking,
    showUpgradeModal,
    currentUsage,
    isUpgrading,

    // Actions
    checkUsage,
    upgradeToPro,
    startTrial,
    closeUpgradeModal,
    setShowUpgradeModal,
  };
}
