'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface WalletData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnAmount: number;
  refundedAmount: number;
  platformCommission: number;
  processingFees: number;
  totalSales: number;
  totalRefunds: number;
}

export interface EarningsData {
  daily: Array<{ date: string; amount: number }>;
  weekly: Array<{ week: string; amount: number }>;
  monthly: Array<{ month: string; amount: number }>;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    amount: number;
    sales: number;
  }>;
}

export interface Transaction {
  _id: string;
  type: 'course_sale' | 'material_sale' | 'refund' | 'payout' | 'adjustment';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  grossAmount: number;
  netAmount: number;
  platformFee: number;
  description?: string;
  createdAt: string;
  courseId?: {
    _id: string;
    title: string;
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface WalletAnalytics {
  conversionRate: number;
  averageOrderValue: number;
  topPerformingCourse: string;
  monthlyGrowth: number;
}

/**
 * useWallet Hook
 * 
 * Fetches and manages instructor wallet data with automatic refresh
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [walletRes, earningsRes, transactionsRes, analyticsRes] = await Promise.all([
        api.get('/instructor/wallet'),
        api.get('/instructor/earnings'),
        api.get('/instructor/transactions?limit=50'),
        api.get('/instructor/analytics'),
      ]);

      if (walletRes.data.success) {
        setWallet(walletRes.data.data.formatted || walletRes.data.data);
      }

      if (earningsRes.data.success) {
        setEarnings(earningsRes.data.data);
      }

      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data.transactions);
      }

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch wallet data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchWallet();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchWallet, 60000);

    return () => clearInterval(interval);
  }, [fetchWallet]);

  return {
    wallet,
    earnings,
    transactions,
    analytics,
    isLoading,
    error,
    refresh,
  };
}
