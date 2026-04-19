"use client";

import { Logo } from "@/components/global/logo";
import Image from "next/image";
import { RegisterForm } from "@/components/site/auth/register-flow/forms/register-form";
import { VerifyEmailForm } from "@/components/site/auth/register-flow/forms/verify-email-form";
import { WelcomeForm } from "@/components/site/auth/register-flow/forms/welcome-form";
import { OnboardingForm } from "@/components/site/auth/register-flow/forms/onboarding-form";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function RegisterFlowLayout() {
  // 1 = Register, 2 = Verify Email, 3 = Welcome, 4 = Onboarding
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");

  // Hydrate email from session storage if it exists (supports refresh without losing context)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("verifyEmail");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (storedEmail) setEmail(storedEmail);
      const storedStep = sessionStorage.getItem("registerStep");
      if (storedStep === "2") setStep(2);
      if (storedStep === "3") setStep(3);
      if (storedStep === "4") setStep(4);
      const storedRole = sessionStorage.getItem("registerRole");
      if (storedRole) setRole(storedRole);
    }
  }, []);

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
      {/* Left Pane: BG image with marketing content */}
      <div className="relative hidden lg:flex items-center justify-center">
        <div className="relative h-[96%] w-[96%] rounded-3xl overflow-hidden">
          <Image
            src="/images/auth/BG.png"
            alt="Decorative background"
            fill
            priority
          />
          <div className="absolute inset-0 bg-black/30" aria-hidden />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-10 pb-10 md:pb-14 lg:pb-16">
            <div className="mb-6 flex items-center gap-2 text-white/90">
              <Link href="/" className="flex items-center gap-2 font-medium">
                <Logo className="size-6" />
                Vonova
              </Link>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Get Started with Us
            </h2>
            <p className="mt-2 text-xs md:text-sm text-white/70 max-w-sm">
              Complete these easy steps to register your account.
            </p>

            <div className="mt-6 space-y-2.5 w-[50%]">
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 1 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 1 ? stepClasses.activeNum : stepClasses.mutedNum}`}>1</div>
                <p className="text-sm md:text-[13px] font-medium">Sign up your account</p>
              </div>
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 2 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 2 ? stepClasses.activeNum : stepClasses.mutedNum}`}>2</div>
                <p className="text-sm md:text-[13px] font-medium">Verify your email</p>
              </div>
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 3 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 3 ? stepClasses.activeNum : stepClasses.mutedNum}`}>3</div>
                <p className="text-sm md:text-[13px] font-medium">Welcome to Vonova</p>
              </div>
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${step === 4 ? stepClasses.active : stepClasses.muted}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 4 ? stepClasses.activeNum : stepClasses.mutedNum}`}>4</div>
                <p className="text-sm md:text-[13px] font-medium">Complete Profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Flow forms */}
      <div className="flex p-6 md:p-10 items-center justify-center">
        <div className="mx-auto w-full max-w-sm">
          {step === 1 && (
            <RegisterForm
              onSuccess={({ email: e }) => {
                setEmail(e);
                setStep(2);
                if (typeof window !== "undefined") sessionStorage.setItem("registerStep", "2");
              }}
            />
          )}
          {step === 2 && (
            <VerifyEmailForm
              email={email}
              onSuccess={() => {
                setStep(3);
                if (typeof window !== "undefined") sessionStorage.setItem("registerStep", "3");
              }}
            />
          )}
          {step === 3 && (
            <WelcomeForm
              email={email}
              onSuccess={({ role: r }) => {
                setRole(r);
                setStep(4);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("registerStep", "4");
                  sessionStorage.setItem("registerRole", r);
                }
              }}
            />
          )}
          {step === 4 && <OnboardingForm email={email} role={role} />}
        </div>
      </div>
    </div>
  );
}
