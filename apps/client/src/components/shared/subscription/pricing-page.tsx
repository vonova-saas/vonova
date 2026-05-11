'use client';

import { useState } from 'react';
import { usePricing, useUpgradeSubscription, useMySubscription } from '@/hooks/app/subscription/use-subscription';
import { useCreateCheckoutSession } from '@/hooks/app/payments/use-payments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { data: pricingData, isLoading: isPricingLoading } = usePricing();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useMySubscription();
  const upgradeMutation = useUpgradeSubscription();
  const checkoutMutation = useCreateCheckoutSession();

  const isLoading = isPricingLoading || isSubscriptionLoading;
  const currentPlan = subscriptionData?.data?.plan || 'FREE';
  const isPro = currentPlan === 'PRO';

  const handleUpgrade = async () => {
    const billingCycle = isYearly ? 'YEARLY' : 'MONTHLY';
    
    // For Stripe integration, create checkout session
    const successUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/pricing`;
    
    checkoutMutation.mutate({
      billingCycle,
      successUrl,
      cancelUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const monthlyPrice = pricingData?.data?.monthly?.amount || 9.99;
  const yearlyPrice = pricingData?.data?.yearly?.amount || 99.99;
  const yearlyMonthlyEquivalent = (yearlyPrice / 12).toFixed(2);

  const freeFeatures = [
    '1 AI article per day',
    '1 PDF summary per day',
    '1 AI roadmap per day',
    '1 AI voice chat per day',
    'Basic course access',
    'Community access',
  ];

  const proFeatures = [
    'Unlimited AI articles',
    'Unlimited PDF summaries',
    'Unlimited AI roadmaps',
    'Unlimited AI voice chat',
    'Unlimited AI quizzes (Instructors)',
    'Priority support',
    'Advanced analytics',
    'All courses access (purchase required)',
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock the full potential of AI-powered learning with our Pro plan
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
          Yearly
        </span>
        {isYearly && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Save {Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)}%
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className={isPro ? 'opacity-60' : 'border-2 border-primary'}>
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>For getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={!isPro}
            >
              {isPro ? 'Downgrade' : 'Current Plan'}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={isPro ? 'border-2 border-primary' : 'relative'}>
          {!isPro && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              Pro
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </CardTitle>
            <CardDescription>Unlimited AI power</CardDescription>
            <div className="mt-4">
              {isYearly ? (
                <>
                  <span className="text-4xl font-bold">${yearlyPrice}</span>
                  <span className="text-muted-foreground">/year</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${yearlyMonthlyEquivalent}/month billed annually
                  </p>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">${monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={handleUpgrade}
              disabled={isPro || upgradeMutation.isPending || checkoutMutation.isPending}
            >
              {upgradeMutation.isPending || checkoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isPro ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Cancel anytime. No hidden fees. Secure payment with Stripe.</p>
        <p className="mt-2">
          Questions? Contact our support team at support@vonova.com
        </p>
      </div>
    </div>
  );
}
