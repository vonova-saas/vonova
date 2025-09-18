import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Generate sample product data
const generateProductData = () => {
  const categories = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'];

  return categories.map((category) => ({
    id: category,
    category,
    sales: Math.floor(Math.random() * 10000) + 1000,
    orders: Math.floor(Math.random() * 500) + 50,
    revenue: Math.floor(Math.random() * 50000) + 10000,
    items: Array.from({ length: 5 }, (_, i) => ({
      id: `${category.toLowerCase()}-${i + 1}`,
      name: `${category} Product ${i + 1}`,
      price: Math.floor(Math.random() * 500) + 50,
      sales: Math.floor(Math.random() * 100) + 10,
      stock: Math.floor(Math.random() * 500) + 50,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviews: Math.floor(Math.random() * 100) + 5,
    })),
  }));
};

const generateInventoryData = () => {
  return [
    { id: 'In Stock', label: 'In Stock', value: 65, color: '#10b981' },
    { id: 'Low Stock', label: 'Low Stock', value: 20, color: '#f59e0b' },
    { id: 'Out of Stock', label: 'Out of Stock', value: 15, color: '#ef4444' },
  ];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProductReport({ dateRange }: { dateRange?: DateRange }) {
  const productData = useMemo(generateProductData, []);
  const inventoryData = useMemo(generateInventoryData, []);

  // Transform product data for the bar chart
  const barChartData = useMemo(() =>
    productData.map(category => ({
      category: category.category,
      sales: category.sales,
      orders: category.orders,
      revenue: category.revenue,
    })),
    [productData]
  );

  // Flatten the product items for the table
  const allProducts = useMemo(() =>
    productData.flatMap(category =>
      category.items.map(item => ({
        ...item,
        category: category.category,
        revenue: item.price * item.sales,
      }))
    ).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    [productData]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sales by Category Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveBar
            data={barChartData}
            keys={['sales']}
            indexBy="category"
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            padding={0.3}
            colors={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']}
            axisBottom={{
              tickRotation: -45,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Sales',
              legendPosition: 'middle',
              legendOffset: -50,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            tooltip={({ id, value, color, indexValue }) => (
              <div className="bg-white p-2 border rounded shadow-lg">
                <strong>{indexValue}</strong>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                  {id}: {value} units
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Inventory Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col">
          <div className="h-[300px] w-full">
            <ResponsivePie
              data={inventoryData}
              margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.6}
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
              colors={['#10b981', '#f59e0b', '#ef4444']}
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
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold">65%</div>
              <div className="text-sm text-muted-foreground">In Stock</div>
            </div>
            <div>
              <div className="text-2xl font-bold">20%</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15%</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Products Card */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.sales}</TableCell>
                  <TableCell>${product.revenue.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${product.stock > 100 ? 'bg-green-500' :
                            product.stock > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(100, (product.stock / 500) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{product.stock} units</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-yellow-300 me-1"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 22 20"
                      >
                        <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
                      </svg>
                      {product.rating} ({product.reviews})
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Performance Card */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveBar
              data={barChartData}
              keys={['revenue', 'orders']}
              indexBy="category"
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
              padding={0.3}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#3b82f6', '#8b5cf6']}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Value',
                legendPosition: 'middle',
                legendOffset: -50,
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'top-right',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: -30,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 12,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]}
              role="application"
              ariaLabel="Category performance"
              barAriaLabel={e => `${e.id}: ${e.formattedValue} in category: ${e.indexValue}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
