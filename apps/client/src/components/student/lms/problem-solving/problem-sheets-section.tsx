"use client";

import Link from "next/link";
import { ClipboardList, Loader2 } from "lucide-react";
import { useUserId } from "@/hooks";
import { useStudentProblemSheetsQuery } from "@/hooks/student/use-problem-solving";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProblemSheetsSection() {
  const userId = useUserId();
  const { data: sheets = [], isLoading } = useStudentProblemSheetsQuery();

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Problem sheets</h2>
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading sheets...
        </div>
      </section>
    );
  }

  if (sheets.length === 0) return null;

  return (
    <section className="mb-12 w-full max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Problem sheets</h2>
        <Badge variant="secondary" className="rounded-full">
          {sheets.length}
        </Badge>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Work through curated problem bundles in order. Your progress is saved as you go.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sheets.map((sheet) => (
          <Card key={sheet._id} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{sheet.title}</CardTitle>
              {sheet.tags && sheet.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sheet.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="line-clamp-3 min-h-[48px] text-sm text-muted-foreground">
                {sheet.description || "A sequential set of coding problems."}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{sheet.totalQuestions ?? sheet.problems?.length ?? 0} questions</span>
                {sheet.timerMinutes ? (
                  <span>{sheet.timerMinutes} min suggested</span>
                ) : null}
              </div>
              <Link href={`/student/${userId}/problem-solving/sheets/${sheet._id}`}>
                <Button className="w-full">Open sheet</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
