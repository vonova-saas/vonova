import Stripe from 'stripe';

/**
 * Stripe Configuration
 * 
 * Production-ready Stripe setup with environment separation.
 * Uses API version 2024-04-10 (latest stable).
 */

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
});

// Configuration object
export const stripeConfig = {
  // Keys
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Connect Settings
  platformFeePercent: 30, // Platform takes 30%, instructor gets 70%

  // Product/Price IDs (set these in environment variables)
  products: {
    proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },

  // Frontend URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
  cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,

  // Connect Account Settings
  connect: {
    // Countries where Stripe Connect is supported
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'DK', 'NO', 'FI', 'IE', 'LU'],

    // Default payout schedule
    payoutSchedule: {
      interval: 'manual' as const, // or 'daily', 'weekly', 'monthly'
    },
  },
};

// Validate configuration on startup
export function validateStripeConfig(): void {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`);
  }

  // Validate price IDs in production
  if (process.env.NODE_ENV === 'production') {
    const missingPrices: string[] = [];
    if (!stripeConfig.products.proMonthly) missingPrices.push('STRIPE_PRO_MONTHLY_PRICE_ID');
    if (!stripeConfig.products.proYearly) missingPrices.push('STRIPE_PRO_YEARLY_PRICE_ID');

    if (missingPrices.length > 0) {
      console.warn(`Warning: Missing Stripe Price IDs: ${missingPrices.join(', ')}`);
    }
  }
}

// Currency configuration
export const supportedCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
export const defaultCurrency = 'usd';

// Helper to convert amount to smallest currency unit (cents)
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to convert from cents to decimal
export function fromCents(amount: number): number {
  return amount / 100;
}
