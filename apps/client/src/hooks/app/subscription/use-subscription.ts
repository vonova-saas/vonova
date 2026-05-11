import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMySubscriptionFn,
  getSubscriptionHistoryFn,
  checkPlanFn,
  upgradeSubscriptionFn,
  cancelSubscriptionFn,
  getPricingFn,
  type Subscription,
  type PlanInfo,
  type PricingInfo,
} from '@/services/app/subscription/subscription.api';

// Query Keys
export const subscriptionKeys = {
  all: ['subscription'] as const,
  mySubscription: () => [...subscriptionKeys.all, 'my-subscription'] as const,
  history: () => [...subscriptionKeys.all, 'history'] as const,
  plan: () => [...subscriptionKeys.all, 'plan'] as const,
  pricing: () => [...subscriptionKeys.all, 'pricing'] as const,
};

// Hooks
export const useMySubscription = () => {
  return useQuery({
    queryKey: subscriptionKeys.mySubscription(),
    queryFn: getMySubscriptionFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubscriptionHistory = () => {
  return useQuery({
    queryKey: subscriptionKeys.history(),
    queryFn: getSubscriptionHistoryFn,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCheckPlan = () => {
  return useQuery({
    queryKey: subscriptionKeys.plan(),
    queryFn: checkPlanFn,
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent for limits
  });
};

export const usePricing = () => {
  return useQuery({
    queryKey: subscriptionKeys.pricing(),
    queryFn: getPricingFn,
    staleTime: 60 * 60 * 1000, // 1 hour - pricing doesn't change often
  });
};

export const useUpgradeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upgradeSubscriptionFn,
    onSuccess: (data) => {
      toast.success('Subscription upgraded successfully!');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upgrade subscription');
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscriptionFn,
    onSuccess: (data) => {
      toast.success('Subscription will be cancelled at the end of the billing period');
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });
};

// Utility hook to check if user has Pro plan
export const useIsPro = () => {
  const { data, isLoading } = useCheckPlan();
  return {
    isPro: data?.data?.plan === 'PRO' && data?.data?.status === 'ACTIVE',
    isLoading,
    plan: data?.data?.plan,
    status: data?.data?.status,
    limits: data?.data?.limits,
  };
};

// Utility hook to check AI usage limits
export const useAILimits = (feature: keyof PlanInfo['limits']) => {
  const { data, isLoading, refetch } = useCheckPlan();
  const limit = data?.data?.limits?.[feature] ?? 0;
  const isUnlimited = limit === -1;

  return {
    limit,
    isUnlimited,
    isLoading,
    refetch,
    canUse: () => {
      if (isUnlimited) return true;
      // You would need to track usage separately or fetch from backend
      return true; // Placeholder - implement actual usage tracking
    },
  };
};
