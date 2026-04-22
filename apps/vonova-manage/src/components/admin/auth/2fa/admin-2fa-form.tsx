/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAdminId from "@/hooks/admin/use-admin-id";

export function Admin2FAForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTime, setResendTime] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const adminId = useAdminId();

  // Auto-submit when all fields are filled
  useEffect(() => {
    if (code.every(digit => digit !== '') && !isSubmitting) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(new Event('submit') as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTime > 0) {
      const timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTime]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // Only allow numbers and ensure single digit
    if (value && !/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text/plain').replace(/\D/g, '');
    const newCode = [...code];

    for (let i = 0; i < Math.min(paste.length, 6); i++) {
      newCode[i] = paste[i];
    }

    setCode(newCode);
  };

  const handleResendCode = () => {
    if (resendTime === 0) {
      // TODO: Add resend code logic here
      setResendTime(30);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Add 2FA verification logic here
    const verificationCode = code.join('');

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(adminId ? `/admin/${adminId}` : "/admin");
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-gray-600">
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className={cn("space-y-6", className)}
          {...props}
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-center">
            <div className="flex space-x-2 mb-6">
              {code.map((digit, index) => (
                <div key={index} className="relative">
                  <Input
                    ref={(el) => {
                      if (el) {
                        inputRefs.current[index] = el;
                      }
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="w-12 h-16 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={isSubmitting}
                    autoFocus={index === 0}
                  />
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={code.some(digit => !digit) || isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
