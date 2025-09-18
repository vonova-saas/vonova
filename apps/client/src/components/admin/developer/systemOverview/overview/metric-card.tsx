import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/functions";
import { TrendingDown, TrendingUp } from "lucide-react";
import { MetricCardProps } from "../types";

export function MetricCard({
  title,
  value,
  change,
  icon,
  isLoading = false,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("h-full w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {change !== undefined && (
          <div
            className={cn(
              "mt-1 flex items-center text-xs",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {Math.abs(change)}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}
