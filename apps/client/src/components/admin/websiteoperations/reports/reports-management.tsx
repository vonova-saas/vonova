"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport } from "./sales/sales-report";
import { TransactionsReport } from "./transactions/transactions-report";
import { ProductReport } from "./products/product-report";
import { CustomersReport } from "./customers/customers-report";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ShoppingCart, SquareChartGantt, Users } from "lucide-react";
import { useAutoRefresh } from "@/hooks/admin/use-auto-refresh";
import { TimeRangeSelector } from "@/components/admin/developer/systemOverview/time-range-selector";

type TimeRange = '24h' | '7d' | '30d' | 'custom';

export default function ReportsManagement() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

  const [dateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const {
    isAutoRefreshing,
    triggerRefresh,
  } = useAutoRefresh(30);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting report with date range:", dateRange);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => triggerRefresh()}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            See reports for the selected time range of Onyx
          </p>
          <TimeRangeSelector
            range={timeRange}
            onRangeChange={setTimeRange}
            customDate={customDate}
            onCustomDateChange={setCustomDate}
          />
        </div>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <SquareChartGantt className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomersReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsReport dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
