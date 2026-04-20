import React from "react";
import { BookOpen, Layers3, Brain, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockActivities = [
  {
    type: "quiz",
    icon: Layers3,
    iconClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
    description: "Completed Quiz: Algebra Basics",
    time: "2 hours ago",
  },
  {
    type: "book",
    icon: BookOpen,
    iconClass: "text-sky-400",
    badgeClass: "bg-sky-500/12 text-sky-300 border-sky-500/25",
    description: "Read Chapter 3 of 'Learning React'",
    time: "5 hours ago",
  },
  {
    type: "ai",
    icon: Brain,
    iconClass: "text-violet-400",
    badgeClass: "bg-violet-500/12 text-violet-300 border-violet-500/25",
    description: "Used AI Assistant for math problem",
    time: "Today",
  },
  {
    type: "community",
    icon: MessageCircle,
    iconClass: "text-orange-400",
    badgeClass: "bg-orange-500/12 text-orange-300 border-orange-500/25",
    description: "Posted in Community: 'Best study tips?'",
    time: "Yesterday",
  },
];

export default function ActivityFeed() {
  return (
    <Card className="rounded-3xl border border-border/55 bg-linear-to-b from-card/90 via-card/75 to-card/65 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl tracking-tight">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockActivities.map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.type}
                className="group relative flex items-center gap-3 rounded-2xl border border-border/40 bg-background/35 p-4 transition-colors duration-200 hover:bg-background/55"
              >
                {idx !== mockActivities.length - 1 && (
                  <span className="absolute left-6 top-[3.15rem] h-6 w-px bg-border/60" />
                )}
                <div className="rounded-xl border border-border/60 bg-background/75 p-2.5">
                  <Icon className={`h-5 w-5 ${activity.iconClass}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground/95">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${activity.badgeClass}`}
                >
                  {activity.type}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
