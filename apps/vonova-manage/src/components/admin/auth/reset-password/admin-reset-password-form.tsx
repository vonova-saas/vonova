"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { adminResetPasswordMutationFn } from "@/services/auth/admin-auth.api";
import { AdminResetPasswordType } from "@/types/api/auth/admin-auth.type";

export function AdminResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
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

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^()_+\-=[\]{};':"\\|,.<>/~`])[A-Za-z\d@$!%*?&^()_+\-=[\]{};':"\\|,.<>/~`]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setFormError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      return;
    }

    try {
      await resetPassword({ oldPassword, newPassword });
      setSuccessMessage("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || "Failed to reset password. Please try again.";
      setFormError(msg);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
        <CardDescription className="text-gray-600">
          Update your admin account password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className={cn("space-y-6", className)}
          {...props}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  tabIndex={-1}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                {isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                {isPending ? "Updating..." : "Update Password"}
              </Button>

              {formError && (
                <p className="text-sm text-red-500 mt-2" role="alert">{formError}</p>
              )}

              {successMessage && (
                <p className="text-sm text-green-500 mt-2" role="alert">{successMessage}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
