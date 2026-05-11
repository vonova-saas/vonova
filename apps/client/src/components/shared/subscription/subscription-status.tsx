'use client';

import { useMySubscription, useCancelSubscription, subscriptionKeys } from '@/hooks/app/subscription/use-subscription';
import { useBillingHistory } from '@/hooks/app/payments/use-payments';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export function SubscriptionStatus() {
  const { data: subscriptionData, isLoading: isSubLoading } = useMySubscription();
  const { data: billingData, isLoading: isBillingLoading } = useBillingHistory();
  const cancelMutation = useCancelSubscription();
  const queryClient = useQueryClient();

  const isLoading = isSubLoading || isBillingLoading;
  const subscription = subscriptionData?.data;
  const billingHistory = billingData?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You're currently on the Free plan with limited features.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/pricing" className="w-full">
            <Button className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const isPro = subscription.plan === 'PRO';
  const isActive = subscription.status === 'ACTIVE';
  const isCancelled = subscription.cancelAtPeriodEnd;
  const periodEnd = new Date(subscription.currentPeriodEnd);

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your billing period.')) {
      cancelMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {isPro && <Sparkles className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{subscription.plan}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Billing Cycle</span>
            <span className="font-semibold">{subscription.billingCycle}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Current Period Ends</span>
            <span className="font-semibold">{format(periodEnd, 'MMM d, yyyy')}</span>
          </div>
          
          {isCancelled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Cancellation Scheduled</p>
                <p className="text-sm text-yellow-700">
                  Your subscription will be cancelled on {format(periodEnd, 'MMM d, yyyy')}. 
                  You'll continue to have access until then.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {isPro && isActive && !isCancelled && (
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Cancel Subscription
            </Button>
          )}
          {isCancelled && (
            <Link href="/pricing">
              <Button>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Reactivate Subscription
              </Button>
            </Link>
          )}
          {!isPro && (
            <Link href="/pricing" className="w-full">
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Your recent payments and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.slice(0, 5).map((payment) => (
                <div key={payment._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'COMPLETED' ? 'bg-green-500' : 
                      payment.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${payment.amount.toFixed(2)}</p>
                    <Badge variant={
                      payment.status === 'COMPLETED' ? 'default' : 
                      payment.status === 'PENDING' ? 'secondary' : 'destructive'
                    }>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
