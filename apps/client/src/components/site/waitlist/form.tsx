"use client";

import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

interface FormProps {
  onSuccessChange?: (success: boolean) => void;
}

function setCookie(name: string, value: string, days = 10) {
  if (typeof document === "undefined") return;
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function WaitlistForm({ onSuccessChange }: FormProps) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
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

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    try {
      setLoading(true);

      const promise = new Promise<{ name: string; message: string }>(
        async (resolve, reject) => {
          try {
            const { fullName, email } = formData;

            // Add user to waitlist via backend API
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/waitlist/add-user`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: email,
                  fullName: fullName,
                }),
              },
            );

            if (!response.ok) {
              const errorData = await response.json();

              if (response.status === 409) {
                reject("This email is already on the waitlist");
              } else if (response.status === 400) {
                reject(errorData.message || "Invalid data provided");
              } else if (response.status === 500) {
                reject("Server error. Please try again later");
              } else {
                reject(errorData.message || "Failed to join waitlist");
              }
              return;
            }

            const result = await response.json();
            resolve({ name: fullName, message: result.message });
          } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
              reject("Network error. Please check your connection");
            } else {
              reject(error);
            }
          }
        },
      );

      toast.promise(promise, {
        loading: "Getting you on the waitlist... 🚀",
        success: (data: { name: string; message: string }) => {
          setFormData({ email: "", fullName: "" });
          setSuccess(true);
          onSuccessChange?.(true);

          // Persist success in cookie so we keep the state on reload
          setCookie("waitlist_joined", "1");
          setCookie("waitlist_name", data.name);

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
          return data.message || "Welcome to the waitlist! Check your inbox 🎉";
        },
        error: (error) => {
          console.error("Form submission error:", error);
          if (typeof error === "string") {
            return error;
          }
          return "Failed to join waitlist. Please try again 😢";
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
    setFormData({ email: "", fullName: "" });
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
            className="px-6 py-2 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
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
                  className="absolute right-0 font-semibold top-0 bottom-0 flex justify-center items-center cursor-pointer px-5 py-2 m-2 rounded-[12px] hover:bg-opacity-90 transition-all disabled:opacity-50"
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
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="flex-grow bg-background border border-border text-foreground px-4 py-3 rounded-[12px] focus:outline-1 transition-all duration-300 focus:outline-offset-4"
                    disabled={loading}
                    required
                    minLength={2}
                  />
                  <Button
                    type="submit"
                    className="absolute right-0 font-semibold top-0 bottom-0 flex justify-center items-center cursor-pointer px-5 py-2 m-2 rounded-[12px] hover:bg-opacity-90 transition-all disabled:opacity-50"
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
                        Joining...
                      </span>
                    ) : (
                      <span>Join waitlist</span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  We&apos;ll send you a confirmation email with all the details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      )}
    </div>
  );
}
