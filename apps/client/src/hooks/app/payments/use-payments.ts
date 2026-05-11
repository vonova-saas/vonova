import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getBillingHistoryFn,
  getUserPaymentsFn,
  createCheckoutSessionFn,
  purchaseCourseFn,
  purchaseMaterialFn,
  type Payment,
  type BillingHistoryResponse,
  type CheckoutSessionRequest,
} from '@/services/app/payments/payments.api';

// Query Keys
export const paymentsKeys = {
  all: ['payments'] as const,
  billingHistory: () => [...paymentsKeys.all, 'billing-history'] as const,
  userPayments: () => [...paymentsKeys.all, 'user-payments'] as const,
};

// Hooks
export const useBillingHistory = () => {
  return useQuery({
    queryKey: paymentsKeys.billingHistory(),
    queryFn: getBillingHistoryFn,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserPayments = () => {
  return useQuery({
    queryKey: paymentsKeys.userPayments(),
    queryFn: getUserPaymentsFn,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: createCheckoutSessionFn,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast.error('Checkout URL not available');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create checkout session');
    },
  });
};

export const usePurchaseCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseCourseFn,
    onSuccess: (data) => {
      toast.success('Course purchased successfully!');
      queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to purchase course');
    },
  });
};

export const usePurchaseMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseMaterialFn,
    onSuccess: (data) => {
      toast.success('Material purchased successfully!');
      queryClient.invalidateQueries({ queryKey: paymentsKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to purchase material');
    },
  });
};
