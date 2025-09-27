"use client";

import { Logo } from "@/components/global/logo";
import Image from "next/image";
import { ForgetPasswordForm } from "@/components/site/auth/forget-password/forms/forget-password-form";
import { OtpCodeForm } from "@/components/site/auth/forget-password/forms/otp-code-form";
import { ChangePasswordForm } from "@/components/site/auth/forget-password/forms/change-password-form";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function ForgetPasswordFlowLayout() {
  // 1 = Forget Password, 2 = OTP Code, 3 = Change Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>("");

  // Hydrate email from session storage if it exists (supports refresh without losing context)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("resetEmail");
      if (storedEmail) setEmail(storedEmail);
      const storedStep = sessionStorage.getItem("fpStep");
      // If user had reached OTP previously and refreshes, keep them on OTP
      if (storedStep === "2" && storedEmail) setStep(2);
      // If user had reached Change Password and refreshes, reset to first step for security
      if (storedStep === "3") {
        setStep(1);
        // Optional: we could clear the storedStep to enforce restart
        sessionStorage.removeItem("fpStep");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("resetEmail", email);
      sessionStorage.setItem("fpStep", step.toString());
    }
  }, [email, step]);

  const stepClasses = useMemo(
    () => ({
      active: "bg-white text-slate-900 shadow/20 shadow-black/20",
      muted: "bg-white/10 text-white/90 ring-1 ring-white/15 backdrop-blur-sm",
      activeNum: "bg-slate-900 text-white text-[10px] font-semibold",
      mutedNum: "bg-white/15 text-white text-[10px] font-semibold",
    }),
    []
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Pane: Flow forms */}
      <div className="flex p-6 md:p-10 items-center justify-center">
        <div className="mx-auto w-full max-w-sm">
          {step === 1 && (
            <ForgetPasswordForm
              onSuccess={({ email: e }) => {
                setEmail(e);
                setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <OtpCodeForm
              email={email}
              onSuccess={() => {
                setStep(3);
              }}
            />
          )}
          {step === 3 && <ChangePasswordForm />}
        </div>
      </div>

      {/* Right Pane: BG image with marketing content */}
      <div className="relative hidden lg:flex items-center justify-center">
        {/* Inset rounded container holding the background image */}
        <div className="relative h-[96%] w-[96%] rounded-3xl overflow-hidden">
          <Image
            src="/images/auth/BG.png"
            alt="Decorative background"
            fill
            priority
          />
          {/* Dark vignette only over the image area */}
          <div className="absolute inset-0 bg-black/30" aria-hidden />

          {/* Content to match the provided visual */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-10 pb-10 md:pb-14 lg:pb-16">
            <div className="mb-6 flex items-center gap-2 text-white/90">
              <Link href="/" className="flex items-center gap-2 font-medium">
                <Logo className="size-6" />
                Vonova
              </Link>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Reset Your Password
            </h2>
            <p className="mt-2 text-xs md:text-sm text-white/70 max-w-sm">
              Follow these quick steps to recover access to your account.
            </p>

            {/* Register Steps */}
            <div className="mt-6 space-y-2.5 w-[50%]">
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 1 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 1 ? stepClasses.activeNum : stepClasses.mutedNum}`}>1</div>
                <p className="text-sm md:text-[13px] font-medium">Request reset code</p>
              </div>
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 2 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 2 ? stepClasses.activeNum : stepClasses.mutedNum}`}>2</div>
                <p className="text-sm md:text-[13px] font-medium">Verify code</p>
              </div>
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 3 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 3 ? stepClasses.activeNum : stepClasses.mutedNum}`}>3</div>
                <p className="text-sm md:text-[13px] font-medium">Change password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}