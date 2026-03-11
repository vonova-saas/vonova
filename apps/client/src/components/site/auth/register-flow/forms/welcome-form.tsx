/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { welcomeUserMutationFn, welcomeUserOAuthGoogleMutationFn } from "@/services";
import { welcomeUserResponseType } from "@/types/api/app/auth/auth.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ServiceType = 'student' | 'instructor' | null;

const services = [
  {
    id: 'student',
    title: 'Student',
    description: 'Tell us about your learning goals so we can personalize your journey.',
    icon: '🎓',
    questions: [
      {
        label: "What subjects are you most interested in?",
        placeholder: "e.g. Math, Physics, Web Development",
        id: "q1",
        type: "text",
      },
      {
        label: "What is your current level?",
        placeholder: "e.g. Beginner, Intermediate, Advanced",
        id: "q2",
        type: "text",
      },
      {
        label: "What is your primary learning goal for the next 3 months?",
        placeholder: "e.g. Pass a certification, Improve grades, Build a project",
        id: "q3",
        type: "text",
      },
      {
        label: "How many hours per week can you study?",
        placeholder: "e.g. 3, 5, 10+",
        id: "q4",
        type: "number",
      },
      {
        label: "Preferred learning style",
        placeholder: "e.g. Video lessons, Live sessions, Self-paced",
        id: "q5",
        type: "text",
      },
    ]
  },
  {
    id: 'instructor',
    title: 'Instructor',
    description: 'Help us set up your teaching profile and reach the right students.',
    icon: '🧑‍🏫',
    questions: [
      {
        label: "What subjects will you teach?",
        placeholder: "e.g. Algebra, React, Data Science",
        id: "q1",
        type: "text",
      },
      {
        label: "How many years of teaching experience do you have?",
        placeholder: "e.g. 0, 1-3, 4-7, 8+",
        id: "q2",
        type: "text",
      },
      {
        label: "What content format do you prefer?",
        placeholder: "e.g. Recorded courses, Live cohorts, 1:1 tutoring",
        id: "q3",
        type: "text",
      },
      {
        label: "Your primary goal on Vonova",
        placeholder: "e.g. Build audience, Monetize expertise, Mentor students",
        id: "q4",
        type: "text",
      },
      {
        label: "From where you know about Vonova?",
        placeholder: "e.g. Social media, Friend referral, Search engine",
        id: "q5",
        type: "text",
      },
    ]
  }
];

export function WelcomeForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<ServiceType>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: welcomeEmail } = useMutation({ mutationFn: welcomeUserMutationFn });
  const { mutateAsync: welcomeOAuth } = useMutation({ mutationFn: welcomeUserOAuthGoogleMutationFn });

  const handleServiceSelect = (serviceId: ServiceType) => {
    setSelectedService(serviceId);
    setCurrentQuestion(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNext = () => {
    const currentService = services.find(s => s.id === selectedService);
    if (!currentService) return;

    if (currentQuestion < currentService.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      void submitWelcome();
    }
  };

  const submitWelcome = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Map UI selection to backend role
      const role = selectedService === 'student' ? 'STUDENT_USER' : 'INSTRUCTOR_USER';
      const email = typeof window !== 'undefined' ? sessionStorage.getItem('verifyEmail') : null;
      let me: welcomeUserResponseType;

      // Build answers payload expected by backend
      const answerPayload: Record<string, string> = {};
      if (answers.q1) answerPayload.answerOne = answers.q1;
      if (answers.q2) answerPayload.answerTwo = answers.q2;
      if (answers.q3) answerPayload.answerThree = answers.q3;
      if (answers.q4) answerPayload.answerFour = answers.q4 as string;
      if (answers.q5) answerPayload.knowAboutUs = answers.q5;

      if (email) {
        // Email registration flow
        me = await welcomeEmail({ email, role, knowAboutUs: 'Social media' });
        // await welcomeEmail({ email, role, ...answerPayload });
      } else {
        // OAuth flow (providerId is read by backend from http-only cookie)
        me = await welcomeOAuth({ role, knowAboutUs: 'Social media' });
        // await welcomeOAuth({ role, ...answerPayload });
      }

      // Invalidate and fetch current user then route to admin dashboard
      await queryClient.invalidateQueries({ queryKey: ['authUser'] });
      // const me = await getCurrentUserQueryFn();
      const userId = me?.data?.userId;
      const userRole = me?.data?.role as string | undefined; // e.g., 'STUDENT_USER' | 'INSTRUCTOR_USER'
      if (userId) {
        // Choose target path by role, with sensible localhost fallbacks
        const targetPath = userRole === "INSTRUCTOR_USER" ? "/instructor" : "/student";
        window.location.assign(`${targetPath}/${userId}`);
      } else {
        // Fallback if userId is not found
        window.location.assign(`${process.env.NEXT_PUBLIC_APP_SITE_DOMAIN}`);
      }
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      setError(maybeAxios?.response?.data?.message || 'Failed to complete setup');
      setIsLoading(false);
    }
  };

  const currentService = services.find(s => s.id === selectedService);

  if (!selectedService) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Welcome to Vonova</h1>
          <p className="text-muted-foreground">Choose a service to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service.id as ServiceType)}
              className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors flex flex-col h-full"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-muted-foreground mb-4 flex-grow">{service.description}</p>
              <div className="flex items-center text-primary font-medium">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = currentService?.questions[currentQuestion];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {currentService?.title} Setup
        </h1>
        <p className="text-muted-foreground">
          Question {currentQuestion + 1} of {currentService?.questions.length}
        </p>
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }} className="space-y-6">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor={currentQ?.id} className="block text-sm font-medium mb-1">
              {currentQ?.label}
            </Label>
            <Input
              id={currentQ?.id}
              name={currentQ?.id}
              type={currentQ?.type}
              placeholder={currentQ?.placeholder}
              value={answers[currentQ?.id || ''] || ''}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-between">
            {currentQuestion > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedService(null)}
              >
                Back to Services
              </Button>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span>Processing...</span>
              ) : currentQuestion === (currentService?.questions.length || 0) - 1 ? (
                'Finish Setup'
              ) : (
                'Next'
              )}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
