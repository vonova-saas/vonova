import API from "@/services/axios-client";

// Types
export interface Payment {
  _id: string;
  userId: string;
  type: 'SUBSCRIPTION' | 'COURSE' | 'MATERIAL';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  provider: 'STRIPE' | 'PAYPAL';
  description: string;
  providerPaymentId?: string;
  courseId?: string;
  materialId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistoryResponse {
  message: string;
  data: Payment[];
}

export interface CheckoutSessionRequest {
  billingCycle: 'MONTHLY' | 'YEARLY';
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  message: string;
  data: {
    sessionId: string;
    url: string;
  };
}

// API Functions
export const getBillingHistoryFn = async (): Promise<BillingHistoryResponse> => {
  const response = await API.get('/api/v1/lms/payments/billing-history');
  return response.data;
};

export const getUserPaymentsFn = async (): Promise<{ message: string; data: Payment[] }> => {
  const response = await API.get('/api/v1/lms/payments/my-payments');
  return response.data;
};

export const createCheckoutSessionFn = async (
  data: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> => {
  const response = await API.post('/api/v1/lms/payments/checkout-session', data);
  return response.data;
};

// Purchase course
export const purchaseCourseFn = async (courseId: string): Promise<{ message: string; data: Payment }> => {
  const response = await API.post('/api/v1/lms/courses/purchase', { courseId });
  return response.data;
};

// Purchase material
export const purchaseMaterialFn = async (materialId: string): Promise<{ message: string; data: Payment }> => {
  const response = await API.post('/api/v1/lms/library/purchase', { materialId });
  return response.data;
};
