"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { FaqItem } from "../mock-data";

export default function HelpTab({ faqs }: { faqs: FaqItem[] }) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.id} className="group rounded-md border p-3">
            <summary className="cursor-pointer list-none font-medium">
              {f.question}
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
            {f.tags && (
              <div className="mt-2 flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span key={t} className="text-xs rounded bg-muted px-2 py-0.5">#{t}</span>
                ))}
              </div>
            )}
          </details>
        ))}
      </div>
    </ScrollArea>
  );
}
