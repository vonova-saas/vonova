"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "../ui/button";

interface FormProps {
  onSuccessChange?: (success: boolean) => void;
}

export default function WaitlistForm({ onSuccessChange }: FormProps) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.email || !isValidEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setStep(2);
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      setLoading(true);

      const promise = new Promise(async (resolve, reject) => {
        try {
          const { name, email } = formData;

          // Send welcome email via Gmail
          const mailResponse = await fetch("/api/mail", {
            cache: "no-store",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstname: name,
              email: email,
              name: name,
            }),
          });

          if (!mailResponse.ok) {
            const errorData = await mailResponse.json();
            if (mailResponse.status === 429) {
              reject("Rate limited");
            } else {
              reject(errorData.error || "Email sending failed");
            }
            return;
          }

          // Save to Notion (optional - only if you still want to store data)
          const notionResponse = await fetch("/api/notion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email }),
          });

          if (!notionResponse.ok) {
            // We'll continue even if Notion fails, since email was sent
            console.warn("Notion save failed, but email was sent successfully");
          }

          resolve({ name });
        } catch (error) {
          reject(error);
        }
      });

      toast.promise(promise, {
        loading: "Getting you on the waitlist... 🚀",
        success: () => {
          setFormData({ email: "", name: "" });
          setSuccess(true);
          onSuccessChange?.(true);
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: [
                "#ff0000",
                "#00ff00",
                "#0000ff",
                "#ffff00",
                "#ff00ff",
                "#00ffff",
              ],
            });
          }, 100);
          return "Welcome email sent! Check your inbox 🎉";
        },
        error: (error) => {
          console.error("Form submission error:", error);
          if (error === "Rate limited") {
            return "You're doing that too much. Please try again later";
          }
          if (
            typeof error === "string" &&
            error.includes("Gmail authentication")
          ) {
            return "Email service is temporarily unavailable. Please try again later.";
          }
          if (typeof error === "string" && error.includes("quota")) {
            return "Email service is temporarily at capacity. Please try again later.";
          }
          return "Failed to send welcome email. Please try again 😢";
        },
      });

      await promise;
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ email: "", name: "" });
    setSuccess(false);
    onSuccessChange?.(false);
  };

  return (
    <div className="w-full relative">
      {success ? (
        <motion.div
          className="p-6 flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={resetForm}
            className="text-black px-6 py-2 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
            type="button"
          >
            Join with another email
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex relative"
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="flex-grow bg-background border border-border text-foreground px-4 py-3 rounded-[12px] focus:outline-1 transition-all duration-300 focus:outline-offset-4"
                  disabled={loading}
                  required
                />
                <Button
                  type="submit"
                  className="absolute right-0 font-semibold top-0 bottom-0 flex justify-center items-center cursor-pointer text-black px-5 py-2 m-2 rounded-[12px] hover:bg-opacity-90 transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  Continue
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="name-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="flex-grow bg-background border border-border text-foreground px-4 py-3 rounded-[12px] focus:outline-1 transition-all duration-300 focus:outline-offset-4"
                    disabled={loading}
                    required
                    minLength={2}
                  />
                  <Button
                    type="submit"
                    className="absolute right-0 font-semibold top-0 bottom-0 flex justify-center items-center cursor-pointer text-black px-5 py-2 m-2 rounded-[12px] hover:bg-opacity-90 transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <title>Loading spinner</title>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span>Join waitlist</span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  We&apos;ll send you a welcome email with all the details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
}
