"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { adminResetPasswordMutationFn } from "@/services/auth/admin-auth.api";

export function AdminResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutateAsync: resetPassword, isPending } = useMutation({
    mutationFn: adminResetPasswordMutationFn,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match");
      return;
    }

    // Same rule as gateway/app ResetPasswordDto (server is source of truth; this avoids an extra round trip).
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setFormError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
      return;
    }

    try {
      await resetPassword({ oldPassword, newPassword });
      setSuccessMessage("Password updated.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg =
        maybeAxios?.response?.data?.message ||
        "Could not update password. Try again.";
      setFormError(msg);
    }
  };

  return (
    <form
      className={cn("max-w-md space-y-4", className)}
      {...props}
      onSubmit={handleSubmit}
    >
      <div>
        <h3 className="text-sm font-medium">Change password</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Current password is checked on the server.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oldPassword">Current password</Label>
        <Input
          id="oldPassword"
          name="oldPassword"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          data-lpignore="true"
          required
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          data-lpignore="true"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          data-lpignore="true"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader className="size-4 animate-spin" aria-hidden />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-green-600 dark:text-green-500" role="status">
          {successMessage}
        </p>
      ) : null}
    </form>
  );
}
