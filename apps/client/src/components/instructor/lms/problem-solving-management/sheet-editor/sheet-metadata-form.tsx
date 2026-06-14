"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProblemSheetEntity } from "@/services/instructor/lms/problem-solving/problem-solving.api";

type SheetMetadataFormProps = {
  sheet: ProblemSheetEntity;
  problemCount: number;
};

export function SheetMetadataForm({ sheet, problemCount }: SheetMetadataFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sheet Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input value={sheet.title} className="mt-1" readOnly />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea value={sheet.description || ""} className="mt-1" readOnly />
        </div>
        <div>
          <label className="text-sm font-medium">Difficulty</label>
          <Badge className="mt-1">{sheet.difficulty}</Badge>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Badge
            variant={sheet.status === "published" ? "default" : "secondary"}
            className="mt-1"
          >
            {sheet.status}
          </Badge>
        </div>
        <div>
          <label className="text-sm font-medium">Problems in sheet</label>
          <p className="mt-1 text-sm text-muted-foreground">{problemCount}</p>
        </div>
      </CardContent>
    </Card>
  );
}
