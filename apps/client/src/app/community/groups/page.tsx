"use client";

import { useState } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateGroup,
  useGroups,
  useJoinGroup,
} from "@/hooks/app/community/use-social";
import type {
  CommunityGroup,
  CommunityGroupVisibility,
} from "@/types/api/app/community/social.types";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { plainTextFromCourseDescription } from "@/components/student/lms/courses/course-description-rich";
import Link from "next/link";

function groupCourseId(group: CommunityGroup): string {
  const raw = group.courseId as unknown;
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (
    typeof raw === "object" &&
    raw !== null &&
    "$oid" in (raw as object) &&
    typeof (raw as { $oid?: unknown }).$oid === "string"
  ) {
    return String((raw as { $oid: string }).$oid).trim();
  }
  return String(raw).trim();
}

export default function CommunityGroupsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useGroups();
  const auth = useAuthContextOptional();
  const [open, setOpen] = useState(false);

  const groups = (data?.pages ?? []).flatMap((p) => p.items);
  const groupsUnique = Array.from(new Map(groups.map((g) => [g._id, g])).values());
  // Group creation is gated to instructors and admins server-side; mirror it
  // here so the button doesn't appear for students who would just get a 403.
  const role = String(auth?.user?.role ?? "").toUpperCase();
  const canCreateGroup =
    role === "INSTRUCTOR_USER" ||
    role === "INSTRUCTOR" ||
    role === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">
            Public groups and course communities you belong to (course spaces are
            created automatically — you do not need to create a separate group).
          </p>
        </div>
        {auth?.isAuthenticated && canCreateGroup && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                New group
              </Button>
            </DialogTrigger>
            <CreateGroupDialog onCreated={() => setOpen(false)} />
          </Dialog>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : groupsUnique.length === 0 ? (
        <Card className="space-y-2 p-10 text-center text-sm text-muted-foreground">
          <p>No groups to show yet.</p>
          <p className="text-xs leading-relaxed">
            Course communities appear here when you are the instructor or after you
            enroll. Open a course from your dashboard to use its community, or
            browse public groups below once they exist.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groupsUnique.map((g) => (
            <GroupCard key={g._id} group={g} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group }: { group: CommunityGroup }) {
  const join = useJoinGroup();
  const courseId = groupCourseId(group);
  const isCourseCommunity = Boolean(group.isCourseGroup && courseId);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarImage src={group.avatarUrl ?? undefined} alt={group.name} />
            <AvatarFallback className="rounded-xl">
              <Users className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{group.name}</h3>
            {isCourseCommunity && (
              <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                Course community
              </p>
            )}
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {plainTextFromCourseDescription(group.description) ||
                group.description ||
                "No description"}
            </p>
          </div>
        </div>
        {isCourseCommunity ? (
          <Button size="sm" className="w-full" asChild>
            <Link href={`/community/courses/${courseId}`}>Open community</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            disabled={join.isPending}
            onClick={() => join.mutate(group._id)}
          >
            {join.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Join group"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CreateGroupDialog({ onCreated }: { onCreated: () => void }) {
  const create = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<CommunityGroupVisibility>("PUBLIC");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create a group</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="group-name">Name</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="React Bootcamp"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="group-desc">Description</Label>
          <Textarea
            id="group-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group about?"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(v) =>
              setVisibility(v as CommunityGroupVisibility)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public — anyone can join</SelectItem>
              <SelectItem value="PRIVATE">Private — invite only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={!name.trim() || create.isPending}
          onClick={() => {
            create.mutate(
              {
                name: name.trim(),
                description: description.trim() || undefined,
                visibility,
              },
              {
                onSuccess: () => {
                  setName("");
                  setDescription("");
                  setVisibility("PUBLIC");
                  onCreated();
                },
              },
            );
          }}
        >
          {create.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
