"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput, PinInputField } from "@/components/ui/pin-input";
import { useState, useEffect } from "react";
import { Separator } from "@radix-ui/react-separator";
import { useMutation } from "@tanstack/react-query";
import { verifyResetPasswordCodeMutationFn } from "@/services";

export function OtpCodeForm({
  className,
  email,
  onSuccess,
  ...props
}: React.ComponentProps<"form"> & { email?: string; onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [disabledBtn, setDisabledBtn] = useState(true);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: verifyCode } = useMutation({ mutationFn: verifyResetPasswordCodeMutationFn });

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Format countdown to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle resend code
  const handleResend = () => {
    if (canResend) {
      setCountdown(120);
      setCanResend(false);
      // TODO: Add resend logic here
    }
  };

  // Add submit handler
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    setError(null);
    e.preventDefault();
    try {
      const email = typeof window !== 'undefined' ? sessionStorage.getItem('resetEmail') : null;
      if (!email) {
        setError("Missing email in session. Please request reset again.");
        setIsLoading(false);
        return;
      }
      await verifyCode({ email, code: otp });
      onSuccess?.();
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      setError(maybeAxios?.response?.data?.message || "Invalid or expired code");
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Verify Email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter the code we sent{email ? ` to ${email}` : ""} to reset your password
          </p>
        </div>
        <div className="grid gap-6">
          <PinInput
            type="numeric"
            className="flex h-10 justify-between"
            onComplete={(val) => { setOtp(val); setDisabledBtn(false); }}
            onIncomplete={() => { setOtp(""); setDisabledBtn(true); }}
          >
            {Array.from({ length: 7 }, (_, i) => {
              if (i === 3) return <Separator key={i} orientation="vertical" />;
              return (
                <PinInputField
                  key={i}
                  component={Input}
                // className={`${
                //   form.getFieldState("otp").invalid ? "border-red-500" : ""
                // }`}
                />
              );
            })}
          </PinInput>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={disabledBtn || isLoading}
          >
            Verify Code
          </Button>
        </div>

        {/* Countdown Timer */}
        <div className="text-center">
          <div className="text-2xl font-bold text-[#226950] mb-2">
            {formatTime(countdown)}
          </div>
          <div className="text-sm text-gray-600">
            {canResend ? (
              <span
                className="text-[#226950]"
                onClick={handleResend}
              >
                Don&apos;t receive the OTP?{" "}
                <a href="#" className="underline underline-offset-4 cursor-pointer">
                  Resend
                </a>{" "}
              </span>
            ) : (
              <span className="text-gray-600">
                Don&apos;t receive the OTP? Resend
              </span>
            )}
          </div>
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
