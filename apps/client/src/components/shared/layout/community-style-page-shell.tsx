import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { LucideIcon, Sparkles } from "lucide-react";

type StatItem = {
  label: string;
  value: string;
};

type CommunityStylePageShellProps = {
  badgeLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
  stats: StatItem[];
  children: ReactNode;
};

export default function CommunityStylePageShell({
  badgeLabel,
  title,
  description,
  icon: Icon,
  stats,
  children,
}: CommunityStylePageShellProps) {
  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {badgeLabel}
          </div>
          <div className="mb-2 flex items-center justify-center gap-3">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            {description}
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5"
              >
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{s.value}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <Card className="w-full rounded-2xl border-border/70 shadow-sm">
          <CardContent className="p-4 md:p-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
