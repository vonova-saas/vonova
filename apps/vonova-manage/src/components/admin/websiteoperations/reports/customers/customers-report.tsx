import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Generate sample customer data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateCustomerData = (dateRange?: DateRange) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month) => ({
    month,
    newCustomers: Math.floor(Math.random() * 100) + 20,
    returningCustomers: Math.floor(Math.random() * 300) + 100,
    churned: Math.floor(Math.random() * 50) + 5,
  }));
};

const generateCustomerSegments = () => [
  { id: 'New', label: 'New', value: 25, color: '#3b82f6' },
  { id: 'Returning', label: 'Returning', value: 60, color: '#8b5cf6' },
  { id: 'At Risk', label: 'At Risk', value: 10, color: '#f59e0b' },
  { id: 'Churned', label: 'Churned', value: 5, color: '#ef4444' },
];

const generateTopCustomers = () => [
  { 
    id: 1, 
    name: 'Alex Johnson', 
    email: 'alex@example.com',
    avatar: '/images/avatars/01.png',
    totalSpent: 1249.99,
    orders: 12,
    lastPurchase: '2023-11-15',
    status: 'active'
  },
  { 
    id: 2, 
    name: 'Maria Garcia', 
    email: 'maria@example.com',
    avatar: '/images/avatars/02.png',
    totalSpent: 899.50,
    orders: 8,
    lastPurchase: '2023-11-14',
    status: 'active'
  },
  { 
    id: 3, 
    name: 'James Wilson', 
    email: 'james@example.com',
    avatar: '/images/avatars/03.png',
    totalSpent: 2349.99,
    orders: 5,
    lastPurchase: '2023-11-10',
    status: 'at_risk'
  },
  { 
    id: 4, 
    name: 'Sarah Lee', 
    email: 'sarah@example.com',
    avatar: '/images/avatars/04.png',
    totalSpent: 549.99,
    orders: 3,
    lastPurchase: '2023-10-28',
    status: 'at_risk'
  },
  { 
    id: 5, 
    name: 'David Kim', 
    email: 'david@example.com',
    avatar: '/images/avatars/05.png',
    totalSpent: 1349.99,
    orders: 2,
    lastPurchase: '2023-09-15',
    status: 'churned'
  },
];

export function CustomersReport({ dateRange }: { dateRange?: DateRange }) {
  const customerData = useMemo(() => generateCustomerData(dateRange), [dateRange]);
  const segments = useMemo(generateCustomerSegments, []);
  const topCustomers = useMemo(generateTopCustomers, []);

  // Calculate customer growth rate
  const growthRate = useMemo(() => {
    if (customerData.length < 2) return 0;
    const current = customerData[customerData.length - 1].newCustomers;
    const previous = customerData[customerData.length - 2].newCustomers;
    return ((current - previous) / previous) * 100;
  }, [customerData]);

  // Calculate average order value
  const avgOrderValue = useMemo(() => {
    const totalSpent = topCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const totalOrders = topCustomers.reduce((sum, customer) => sum + customer.orders, 0);
    return totalSpent / totalOrders;
  }, [topCustomers]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Customer Growth Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Customer Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveLine
            data={[
              {
                id: 'New Customers',
                data: customerData.map((item) => ({
                  x: item.month,
                  y: item.newCustomers,
                })),
              },
              {
                id: 'Returning Customers',
                data: customerData.map((item) => ({
                  x: item.month,
                  y: item.returningCustomers,
                })),
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
            axisBottom={{
              tickRotation: -45,
              legend: 'Month',
              legendOffset: 40,
              legendPosition: 'middle',
            }}
            axisLeft={{
              legend: 'Number of Customers',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            useMesh={true}
            colors={['#3b82f6', '#8b5cf6']}
            legends={[
              {
                anchor: 'top-right',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: -30,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 120,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Customer Segments Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col">
          <div className="h-[300px] w-full">
            <ResponsivePie
              data={segments}
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
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
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="white"
              colors={['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
              tooltip={({ datum: { label, value, color } }) => (
                <div className="bg-white p-2 rounded shadow-md border border-gray-200 flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                  <span className="font-medium">{label}:</span>
                  <span className="ml-1">{value}%</span>
                </div>
              )}
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
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Customer Growth</div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  {customerData.reduce((sum, item) => sum + item.newCustomers, 0).toLocaleString()}
                </span>
                <span className={`ml-2 text-sm ${growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">vs previous period</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Avg. Order Value</div>
              <div className="text-2xl font-bold">
                ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground">across all customers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell>{new Date(customer.lastPurchase).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        customer.status === 'active' ? 'default' : 
                        customer.status === 'at_risk' ? 'secondary' : 'destructive'
                      }
                      className="capitalize"
                    >
                      {customer.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Retention Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">30-Day Retention</span>
              <span className="font-bold">68%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">+2.3% from last month</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">90-Day Retention</span>
              <span className="font-bold">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">+1.1% from last month</p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Churn Rate</h4>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-red-500">5.2%</span>
              <span className="ml-2 text-sm text-red-500">+0.4%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Percentage of customers lost this month</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
