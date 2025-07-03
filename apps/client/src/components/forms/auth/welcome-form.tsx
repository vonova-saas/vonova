"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WelcomeForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const questions = [
    {
      label: "What do you want to do?",
      placeholder: "Tell us what you want to do",
      id: "q1",
      type: "text",
    },
    {
      label: "What is your role?",
      placeholder: "e.g. Developer, Manager",
      id: "q2",
      type: "text",
    },
    {
      label: "What is your company name?",
      placeholder: "Enter your company name",
      id: "q3",
      type: "text",
    },
    {
      label: "How many people are on your team?",
      placeholder: "e.g. 1, 5, 10+",
      id: "q4",
      type: "number",
    },
    {
      label: "What is your main goal with Vonova?",
      placeholder: "Describe your main goal",
      id: "q5",
      type: "text",
    },
  ];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[current] = e.target.value;
    setAnswers(newAnswers);
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      // TODO: Handle final submission (e.g., send answers to backend)
      // Send answers to backend
      // try {
      //   const response = await fetch("/api/onboarding", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ answers }),
      //   });

      //   if (!response.ok) {
      //     // Handle error (show message, etc.)
      //     throw new Error("Failed to submit answers");
      //   }

      //   // Optionally handle response data
      //   // const data = await response.json();

      //   // Redirect or show success
      //   router.push("/dashboard");
      // } catch (error) {
      //   // Handle error (show message, etc.)
      //   console.error(error);
      // }
      router.push("/dashboard");
    }
  };

  return (
    <div>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={handleNext}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="text-muted-foreground text-sm text-balance">
            First, tell us a bit about yourself
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor={questions[current].id}>
              {questions[current].label}
            </Label>
            <Input
              id={questions[current].id}
              type={questions[current].type}
              placeholder={questions[current].placeholder}
              value={answers[current]}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full cursor-pointer">
            {current === questions.length - 1 ? "Submit" : "Next"}
          </Button>
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
