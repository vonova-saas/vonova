'use client';

interface WalletChartProps {
  data?: Array<{ date?: string; month?: string; amount: number }>;
  type?: 'daily' | 'monthly';
}

export function WalletChart({ data, type }: WalletChartProps) {
  // Placeholder chart component
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <p className="text-muted-foreground">Chart placeholder - Install recharts for full implementation</p>
    </div>
  );
}
