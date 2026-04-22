"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Mail, Lock, Shield, Loader, Key } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  adminRequestLoginCodeMutationFn, 
  adminVerifyLoginMutationFn 
} from "@/services/auth/admin-auth.api";
import { AdminRequestLoginCodeType, AdminVerifyLoginType } from "@/types/api/auth/admin-auth.type";

type AuthStep = "credentials" | "otp" | "success";

const getAdminIdFromToken = (token: string): string | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const decodedPayload = JSON.parse(atob(payloadBase64)) as {
      adminId?: string;
      userId?: string;
      sub?: string;
    };
    return decodedPayload.adminId ?? decodedPayload.userId ?? decodedPayload.sub ?? null;
  } catch {
    return null;
  }
};

export function AdminOTPLoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>("credentials");
  const queryClient = useQueryClient();
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mutations
  const { mutateAsync: requestOTP, isPending: isRequestingOTP } = useMutation({
    mutationFn: adminRequestLoginCodeMutationFn,
  });

  const { mutateAsync: verifyOTP, isPending: isVerifyingOTP } = useMutation({
    mutationFn: adminVerifyLoginMutationFn,
  });

  // Handle OTP request
  const handleRequestOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    
    try {
      await requestOTP({ email, password });
      setSuccessMessage("OTP sent to your email");
      setCurrentStep("otp");
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || "Failed to send OTP. Please check your credentials.";
      setFormError(msg);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      const response = await verifyOTP({ email, code: otpCode });
      
      // Store JWT token (you might want to use a more secure method)
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('admin_refresh_token', response.refresh_token);
      
      // Invalidate auth user to fetch fresh user
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      setCurrentStep("success");
      // Redirect after successful login
      setTimeout(() => {
        const adminId = getAdminIdFromToken(response.access_token);
        if (adminId) {
          window.location.assign(`/admin/${adminId}`);
          return;
        }
        window.location.assign("/");
      }, 1500);
      
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || "Invalid OTP. Please try again.";
      setFormError(msg);
    }
  };

  const handleBackToCredentials = () => {
    setCurrentStep("credentials");
    setOtpCode("");
    setFormError(null);
    setSuccessMessage(null);
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
          {currentStep === "credentials" && "Enter your credentials to receive OTP"}
          {currentStep === "otp" && "Enter the 6-digit code sent to your email"}
          {currentStep === "success" && "Login successful!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentStep === "credentials" && (
          <form
            className={cn("space-y-6", className)}
            {...props}
            onSubmit={handleRequestOTP}
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
                <Button type="submit" className="w-full cursor-pointer" disabled={isRequestingOTP}>
                  {isRequestingOTP ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  {isRequestingOTP ? "Sending OTP..." : "Request OTP"}
                </Button>

                {formError && (
                  <p className="text-sm text-red-500 mt-2" role="alert">{formError}</p>
                )}
              </div>
            </div>
          </form>
        )}

        {currentStep === "otp" && (
          <form
            className={cn("space-y-6", className)}
            {...props}
            onSubmit={handleVerifyOTP}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  6-Digit Code
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 h-12 text-gray-900 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-center text-lg font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to {email}</p>
              </div>

              <div className="pt-2 space-y-3">
                <Button type="submit" className="w-full cursor-pointer" disabled={isVerifyingOTP}>
                  {isVerifyingOTP ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  {isVerifyingOTP ? "Verifying..." : "Verify & Login"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full cursor-pointer"
                  onClick={handleBackToCredentials}
                >
                  Back to Credentials
                </Button>

                {formError && (
                  <p className="text-sm text-red-500" role="alert">{formError}</p>
                )}
              </div>
            </div>
          </form>
        )}

        {currentStep === "success" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-100">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Login Successful!</h3>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        )}

        {successMessage && currentStep === "credentials" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
