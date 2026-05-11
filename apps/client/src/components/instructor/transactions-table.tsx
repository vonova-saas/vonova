'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/hooks/use-wallet';

interface TransactionsTableProps {
  transactions?: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const items = transactions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{tx.description || tx.type}</p>
                  <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(tx.netAmount)}</span>
                  <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
