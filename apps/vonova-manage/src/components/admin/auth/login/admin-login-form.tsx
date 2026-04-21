"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Mail, Lock, Shield, Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginMutationFn } from "@/services";

export function AdminLoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Add submit handler
  const { mutateAsync: login, isPending } = useMutation({
    mutationFn: loginMutationFn,
    onSettled: () => {
      // no-op
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    try {
      const me = await login({ email, password });
      // Invalidate auth user to fetch fresh user (http-only cookies are set by backend)
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      // Fetch the freshly authenticated user to get the userId and role
      const userId = me?.data?.user?._id;
      const role = me?.data?.user?.role as string | undefined; // e.g., 'STUDENT_USER' | 'INSTRUCTOR_USER'
      if (userId) {
        // Choose target path by role, with sensible localhost fallbacks
        const targetPath = role === "ADMIN" ? "/admin" : "/";
        window.location.assign(`${targetPath}/${userId}`);
      } else {
        // Fallback if userId is not found
        window.location.assign(`${process.env.NEXT_PUBLIC_APP_SITE_DOMAIN}`);
      }
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || "Login failed. Please check your credentials.";
      setFormError(msg);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Admin Portal</CardTitle>
        <CardDescription className="text-gray-600">
          Restricted access. Authorized personnel only.
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
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
                {isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isPending ? "Logging in..." : "Login"}
              </Button>

              {formError && (
                <p className="text-sm text-red-500" role="alert">{formError}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
