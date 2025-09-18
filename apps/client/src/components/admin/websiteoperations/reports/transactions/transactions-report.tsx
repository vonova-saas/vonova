import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { format, subDays } from "date-fns";

// Generate sample data for transactions
const generateTransactionData = (dateRange?: DateRange) => {
  const from = dateRange?.from || subDays(new Date(), 30);
  const to = dateRange?.to || new Date();
  
  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    const transactions = Math.floor(Math.random() * 500) + 200;
    const amount = Math.floor(Math.random() * 50000) + 10000;
    const avgValue = Math.round(amount / transactions);
    
    return {
      date: format(date, 'MMM dd'),
      transactions,
      amount,
      avgValue,
      successful: Math.floor(transactions * 0.92), // 92% success rate
      failed: transactions - Math.floor(transactions * 0.92),
    };
  });
};

const generatePaymentMethods = () => [
  { id: 'Credit Card', label: 'Credit Card', value: 58, color: '#3b82f6' },
  { id: 'PayPal', label: 'PayPal', value: 25, color: '#10b981' },
  { id: 'Bank Transfer', label: 'Bank Transfer', value: 12, color: '#6366f1' },
  { id: 'Crypto', label: 'Crypto', value: 5, color: '#f59e0b' },
];

const generateTopTransactions = () => [
  { 
    id: 'TXN-1001', 
    customer: 'Alex Johnson', 
    amount: 1249.99, 
    status: 'completed',
    method: 'VISA',
    date: '2023-11-15 14:30:22'
  },
  { 
    id: 'TXN-1002', 
    customer: 'Maria Garcia', 
    amount: 899.50, 
    status: 'completed',
    method: 'PayPal',
    date: '2023-11-15 13:45:10'
  },
  { 
    id: 'TXN-1003', 
    customer: 'James Wilson', 
    amount: 2349.99, 
    status: 'pending',
    method: 'Bank Transfer',
    date: '2023-11-15 12:15:33'
  },
  { 
    id: 'TXN-1004', 
    customer: 'Sarah Lee', 
    amount: 549.99, 
    status: 'completed',
    method: 'MasterCard',
    date: '2023-11-15 11:20:45'
  },
  { 
    id: 'TXN-1005', 
    customer: 'David Kim', 
    amount: 349.99, 
    status: 'failed',
    method: 'Amex',
    date: '2023-11-15 10:05:18'
  },
];

export function TransactionsReport({ dateRange }: { dateRange?: DateRange }) {
  const transactionData = useMemo(() => generateTransactionData(dateRange), [dateRange]);
  const paymentMethods = useMemo(generatePaymentMethods, []);
  const recentTransactions = useMemo(generateTopTransactions, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Transaction Volume Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveLine
            data={[
              {
                id: 'Transactions',
                data: transactionData.map((item) => ({
                  x: item.date,
                  y: item.transactions,
                })),
              },
              {
                id: 'Amount ($)',
                data: transactionData.map((item) => ({
                  x: item.date,
                  y: item.amount / 100, // Convert to dollars for display
                })),
                yAxisID: 'amount',
              },
            ]}
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: false,
              reverse: false,
            }}
            yFormat=" >-.2f"
            axisBottom={{
              tickRotation: -45,
              legend: 'Date',
              legendOffset: 40,
              legendPosition: 'middle',
            }}
            axisLeft={{
              legend: 'Transactions',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            axisRight={{
              legend: 'Amount ($)',
              legendOffset: 50,
              legendPosition: 'middle',
            }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            useMesh={true}
            colors={['#3b82f6', '#10b981']}
            enableSlices="x"
            sliceTooltip={({ slice }) => {
              const data = slice.points[0].data;
              const amountData = slice.points.find(p => p.seriesId === 'Amount ($)')?.data;
              return (
                <div className="bg-white p-4 border rounded shadow-lg">
                  <div className="font-semibold">{data.xFormatted}</div>
                  <div className="text-blue-500">Transactions: {data.yFormatted}</div>
                  {amountData && (
                    <div className="text-green-500">
                      Amount: ${Number(amountData.y).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              );
            }}
            legends={[
              {
                anchor: 'top-right',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: -30,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 100,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="h-[300px] w-full">
            <ResponsivePie
              data={paymentMethods}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{
                from: 'color',
                modifiers: [['darker', 0.2]],
              }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLinkLabel={d => `${d.id}: ${d.value}%`}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="white"
              tooltip={({ datum: { label, value, color } }) => (
                <div className="bg-white p-2 rounded shadow-md border border-gray-200 flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                  <span className="font-medium">{label}:</span>
                  <span className="ml-1">{value}%</span>
                </div>
              )}
              defs={[
                {
                  id: 'dots',
                  type: 'patternDots',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.3)',
                  size: 4,
                  padding: 1,
                  stagger: true,
                },
              ]}
              fill={[
                {
                  match: {
                    id: 'Credit Card',
                  },
                  id: 'dots',
                },
              ]}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium">
                        {txn.method.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {txn.customer}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="truncate">{txn.id} • {txn.method}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className={`text-sm font-medium ${
                    txn.status === 'completed' ? 'text-green-600' : 
                    txn.status === 'failed' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    ${txn.amount.toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-500">
                    {new Date(txn.date).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${transactionData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            {transactionData.length} days of data
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {(
                    transactionData.reduce((sum, item) => sum + item.successful, 0) / 
                    transactionData.reduce((sum, item) => sum + item.transactions, 0) * 100
                  ).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${(transactionData.reduce((sum, item) => sum + item.successful, 0) / 
                    transactionData.reduce((sum, item) => sum + item.transactions, 0) * 100)}%` 
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Transaction</span>
              <span className="font-medium">
                ${(transactionData.reduce((sum, item) => sum + item.amount, 0) / 
                  transactionData.reduce((sum, item) => sum + item.transactions, 0))
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Transactions</span>
              <span className="font-medium">
                {transactionData.reduce((sum, item) => sum + item.transactions, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
