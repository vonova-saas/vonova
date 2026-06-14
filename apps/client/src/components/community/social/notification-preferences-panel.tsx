"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/services/app/community/social.api";
import { toast } from "sonner";

const FIELDS: Array<{
  key: keyof Omit<NotificationPreferences, "userId">;
  label: string;
  description: string;
}> = [
  { key: "groupChat", label: "Group chat", description: "Messages in course groups" },
  { key: "mentions", label: "Mentions", description: "@mentions in group chat" },
  { key: "enrollments", label: "Enrollments", description: "New students in your courses" },
  { key: "quizzes", label: "Quizzes", description: "Quiz published and results" },
  { key: "lessons", label: "Lessons & sheets", description: "New lessons and problem sheets" },
  { key: "announcements", label: "Announcements", description: "Course announcements" },
  { key: "marketing", label: "Marketing", description: "Optional product updates" },
];

export function NotificationPreferencesPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<Omit<NotificationPreferences, "userId">>) =>
      updateNotificationPreferences(patch),
    onSuccess: (next) => {
      qc.setQueryData(["notification-preferences"], next);
    },
    onError: () => toast.error("Could not update preferences"),
  });

  if (isLoading || !data) return null;

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Notification preferences</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Choose what you want to receive. Mentions can still reach you when group
        chat is muted.
      </p>
      <div className="space-y-4">
        {FIELDS.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <Label htmlFor={`pref-${key}`} className="text-sm font-medium">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={`pref-${key}`}
              checked={!!data[key]}
              onCheckedChange={(checked) =>
                mutation.mutate({ [key]: checked })
              }
              disabled={mutation.isPending}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
