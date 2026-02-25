import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { ResponsiveLine } from "@nivo/line";
import { format, subDays } from "date-fns";
import { ResponsiveBar } from "@nivo/bar";
import { Separator } from "@/components/ui/separator";

// Generate sample data for the reports
const generateSalesData = (dateRange?: DateRange) => {
  const from = dateRange?.from || subDays(new Date(), 30);
  const to = dateRange?.to || new Date();

  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    return {
      date: format(date, 'MMM dd'),
      sales: Math.floor(Math.random() * 10000) + 1000,
      orders: Math.floor(Math.random() * 100) + 10,
    };
  });
};

const generateTopProducts = () => {
  const products = [
    { id: 1, name: 'Premium T-Shirt', sales: 1200 },
    { id: 2, name: 'Wireless Earbuds', sales: 980 },
    { id: 3, name: 'Smart Watch', sales: 750 },
    { id: 4, name: 'Laptop Backpack', sales: 620 },
    { id: 5, name: 'Bluetooth Speaker', sales: 540 },
  ];
  return products.sort((a, b) => b.sales - a.sales);
};

export function SalesReport({ dateRange }: { dateRange?: DateRange }) {
  const salesData = useMemo(() => generateSalesData(dateRange), [dateRange]);
  const topProducts = useMemo(generateTopProducts, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sales Overview Card */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveLine
            data={[
              {
                id: 'sales',
                data: salesData.map((item) => ({
                  x: item.date,
                  y: item.sales,
                })),
              },
            ]}
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: true,
              reverse: false,
            }}
            axisBottom={{
              tickRotation: -45,
              legend: 'Date',
              legendOffset: 40,
              legendPosition: 'middle',
            }}
            axisLeft={{
              legend: 'Sales ($)',
              legendOffset: -50,
              legendPosition: 'middle',
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            enableArea={true}
            useMesh={true}
            colors={['#2563eb']}
          />
        </CardContent>
      </Card>

      {/* Orders Card */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {salesData.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {salesData.length} days of data
          </p>
          <div className="h-[200px] mt-4">
            <ResponsiveBar
              data={salesData}
              keys={['orders']}
              indexBy="date"
              margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
              padding={0.3}
              colors={['#3b82f6']}
              axisBottom={{
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Orders',
                legendPosition: 'middle',
                legendOffset: -30,
              }}
              enableLabel={false}
              isInteractive={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Products Card */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.sales.toLocaleString()} sales
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  ${(product.sales * 49.99).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Revenue</p>
                <p className="text-sm text-muted-foreground">
                  Last {salesData.length} days
                </p>
              </div>
              <div className="text-2xl font-bold">
                ${(salesData.reduce((sum, item) => sum + item.sales, 0) * 1.5).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Orders</span>
                <span className="font-medium">
                  {salesData.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                <span className="font-medium">
                  ${(salesData.reduce((sum, item) => sum + item.sales, 0) * 1.5 /
                    salesData.reduce((sum, item) => sum + item.orders, 1)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-medium">
                  {((salesData.reduce((sum, item) => sum + item.orders, 0) /
                    (salesData.reduce((sum, item) => sum + item.orders, 0) * 10)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
