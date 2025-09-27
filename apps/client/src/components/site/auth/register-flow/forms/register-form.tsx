"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/global/icons";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { registerMutationFn } from "@/services";
import { baseURL } from "@/services/base-url";

export function RegisterForm({
  className,
  onSuccess,
  ...props
}: React.ComponentProps<"form"> & { onSuccess?: (data: { email: string }) => void }) {
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isGithubLoading, setIsGithubLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Resume flow: if email-verify already completed previously and user returns to register, send to welcome
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = sessionStorage.getItem('verifyEmail');
      if (email) {
        onSuccess?.({ email });
      }
    }
  }, [onSuccess]);

  const handleOAuth = (method: string) => {
    if (method === "google") {
      setIsGoogleLoading(true);
      const target = `${baseURL}/api/v1/auth/google`;
      window.location.assign(target);
    } else if (method === "github") {
      setIsGithubLoading(true);
      // TODO: hook up your GitHub OAuth endpoint
      // window.location.assign("/api/auth/github");
    }
  };

  // Add submit handler
  const { mutateAsync: register, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await register({ name: fullName, email, password });
      // Persist email for the next step to display
      if (typeof window !== "undefined") {
        sessionStorage.setItem("verifyEmail", email);
      }
      onSuccess?.({ email });
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || "Registration failed";
      setFormError(msg);
    }
  };

  // Evaluate password strength and unmet requirements
  const evaluatePassword = (p: string) => {
    const checks = {
      length: p.length >= 8,
      lower: /[a-z]/.test(p),
      upper: /[A-Z]/.test(p),
      number: /\d/.test(p),
      symbol: /[^A-Za-z0-9]/.test(p),
    };
    const score = [checks.length, checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean).length;
    const unmet: string[] = [];
    if (!checks.length) unmet.push("8+ characters");
    if (!checks.lower) unmet.push("lowercase letter");
    if (!checks.upper) unmet.push("uppercase letter");
    if (!checks.number) unmet.push("number");
    if (!checks.symbol) unmet.push("symbol");
    return { score, unmet };
  };
  const { score: pwScore, unmet: pwUnmet } = evaluatePassword(password);
  const isPasswordStrongEnough = pwScore >= 4; // require at least "Good"

  return (
    <div>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Sign Up Account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your personal data to create your account.
          </p>
        </div>
        <div className="grid gap-6">
          {/* Social signup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={isGoogleLoading}
              onClick={() => handleOAuth("google")}
              className="h-11 w-full justify-center rounded-xl cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Icons.google className="h-4 w-4" />
                  <span>Google</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              // disabled={isGithubLoading}
              disabled={true}
              onClick={() => handleOAuth("github")}
              className="h-11 w-full justify-center rounded-xl cursor-pointer"
            >
              {isGithubLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Icons.Github className="h-4 w-4" />
                  <span>Github</span>
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border">
            <span className="bg-background relative z-10 px-2 text-muted-foreground">
              Or
            </span>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="eg. Ahmed"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="eg. Mohamed"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="eg. m@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                className={cn("pr-10", !isPasswordStrongEnough && password ? "border-red-500/40" : "")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-primary focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {(() => {
              const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
              const colors = [
                "text-red-500",
                "text-orange-500",
                "text-amber-500",
                "text-green-500",
              ];
              const idx = Math.min(Math.max(pwScore - 1, 0), 4);
              return (
                <div className="space-y-1">
                  <p className={`text-xs ${password ? colors[idx] : "text-muted-foreground"}`}>
                    Strength: {password ? labels[idx] : "Start typing a password"}
                  </p>
                  {password && pwUnmet.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Try adding: {pwUnmet.join(", ")}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {formError && (
            <p className="text-sm text-red-500" role="alert">{formError}</p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
            {isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isPending ? "Creating account..." : "Register"}
          </Button>

        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <a href="/auth/login" className="underline underline-offset-2 hover:text-primary">
            Log in
          </a>
        </div>
      </form>
      {/* Privacy & Terms at the bottom of the form */}
      <div className="w-full flex justify-center items-center mt-8 mb-2">
        <p className="text-xs text-muted-foreground text-center max-w-md">
          By using Vonova, you are agreeing to our{" "}
          <a
            className="underline underline-offset-2 hover:text-primary"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>{" "}
          and{" "}
          <a
            className="underline underline-offset-2 hover:text-primary"
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            terms of service
          </a>
          .
        </p>
      </div>
    </div>
  );
}
