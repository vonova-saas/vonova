import API from "@/services/axios-client";

// Types
export interface Subscription {
  _id: string;
  userId: string;
  plan: 'FREE' | 'PRO';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  ARTICLE_GENERATION: number;
  PDF_SUMMARY: number;
  ROADMAP_GENERATION: number;
  VOICE_CHAT: number;
  QUIZ_GENERATION?: number;
  PROBLEM_SOLVING?: number;
}

export interface PlanInfo {
  plan: 'FREE' | 'PRO';
  status: string;
  limits: PlanLimits;
}

export interface PricingInfo {
  monthly: {
    amount: number;
    currency: string;
    priceId: string;
  };
  yearly: {
    amount: number;
    currency: string;
    priceId: string;
  };
}

// API Functions
export const getMySubscriptionFn = async (): Promise<{ message: string; data: Subscription | null }> => {
  const response = await API.get('/api/v1/lms/subscriptions/my-subscription');
  return response.data;
};

export const getSubscriptionHistoryFn = async (): Promise<{ message: string; data: Subscription[] }> => {
  const response = await API.get('/api/v1/lms/subscriptions/history');
  return response.data;
};

export const checkPlanFn = async (): Promise<{ message: string; data: PlanInfo }> => {
  const response = await API.get('/api/v1/lms/subscriptions/plan');
  return response.data;
};

export const upgradeSubscriptionFn = async (billingCycle: 'MONTHLY' | 'YEARLY'): Promise<{ message: string; data: Subscription }> => {
  const response = await API.post('/api/v1/lms/subscriptions/upgrade', { billingCycle });
  return response.data;
};

export const cancelSubscriptionFn = async (): Promise<{ message: string; data?: Subscription }> => {
  const response = await API.post('/api/v1/lms/subscriptions/cancel');
  return response.data;
};

export const getPricingFn = async (): Promise<{ message: string; data: PricingInfo }> => {
  const response = await API.get('/api/v1/lms/payments/pricing');
  return response.data;
};
