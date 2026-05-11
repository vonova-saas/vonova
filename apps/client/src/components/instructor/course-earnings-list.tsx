'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';

interface CourseEarning {
  courseId: string;
  courseName: string;
  amount: number;
  sales: number;
}

interface CourseEarningsListProps {
  courses?: CourseEarning[];
}

export function CourseEarningsList({ courses }: CourseEarningsListProps) {
  const items = courses || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings by Course</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No course earnings yet</p>
        ) : (
          <div className="space-y-4">
            {items.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.courseName}</span>
                  <span className="text-sm text-muted-foreground">{course.sales} sales</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Earnings: {formatCurrency(course.amount)}</span>
                </div>
                <Progress value={100} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
