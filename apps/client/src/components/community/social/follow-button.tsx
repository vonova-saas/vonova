"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFollowState,
  useFollowUser,
  useUnfollowUser,
} from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

type FollowButtonProps = {
  userId: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline";
  className?: string;
};

export function FollowButton({
  userId,
  size = "sm",
  variant = "default",
  className,
}: FollowButtonProps) {
  const auth = useAuthContextOptional();
  const me = auth?.user?._id;
  const isSelf = useMemo(() => me === userId, [me, userId]);

  const { data, isLoading } = useFollowState(isSelf ? null : userId);
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  if (isSelf) return null;

  const following = data?.following ?? false;
  const pending = follow.isPending || unfollow.isPending;
  const guest = !auth?.isAuthenticated;

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "outline" : variant}
      disabled={pending || isLoading || guest}
      onClick={() => {
        if (guest) {
          return;
        }
        following ? unfollow.mutate(userId) : follow.mutate(userId);
      }}
      className={cn(
        "gap-2 rounded-full",
        following && "border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive",
        className,
      )}
      aria-pressed={following}
    >
      {pending || isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserMinus className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      <span>{following ? "Following" : "Follow"}</span>
    </Button>
  );
}
