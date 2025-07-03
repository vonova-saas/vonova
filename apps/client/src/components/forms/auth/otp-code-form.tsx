"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { PinInput, PinInputField } from "@/components/forms/pin-input";
import { useState } from "react";
import { Separator } from "@radix-ui/react-separator";

export function OtpCodeForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [disabledBtn, setDisabledBtn] = useState(true);

  // Add submit handler
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // TODO: Add otp code logic here
    setIsLoading(true);
    e.preventDefault();
    router.push("/change-password");
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
            Enter the send code below to Reset your password
          </p>
        </div>
        <div className="grid gap-6">
          <PinInput
            type="numeric"
            className="flex h-10 justify-between"
            onComplete={() => setDisabledBtn(false)}
            onIncomplete={() => setDisabledBtn(true)}
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

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={disabledBtn || isLoading}
          >
            Login
          </Button>
        </div>
        <div className="text-center text-sm">
          <a href="#" className="underline underline-offset-4">
            Resend the code
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
