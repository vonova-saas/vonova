"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Icons from "@/components/global/icons";
import { useState } from "react";
import { Loader } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // const [isEmailOpen, setIsEmailOpen] = useState<boolean>(true);
  // const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleOAuth = (method: string) => {
    if (method === "google") {
      setIsGoogleLoading(true);
      window.location.assign("/api/auth/google");
    } else if (method === "github") {
      // window.location.href = `${baseURL}/auth/github`;
      // setIsGitHubLoading(true);
    }
  };

  // Add submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    router.push("/verify-email");
  };

  return (
    <div>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Register to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to Register to your account
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="name"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                className="pr-10"
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
          </div>
          <Button type="submit" className="w-full cursor-pointer">
            Register
          </Button>
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full relative cursor-pointer"
            type="button"
            disabled={isGoogleLoading}
            onClick={() => handleOAuth("google")}
          >
            {isGoogleLoading ? (
              <Loader className="w-4 h-4 mx-auto animate-spin" />
            ) : (
              <>
                <Icons.google />
                <span className="ml-2">Login with Google</span>
              </>
            )}
          </Button>
        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline underline-offset-4">
            Sign in
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
