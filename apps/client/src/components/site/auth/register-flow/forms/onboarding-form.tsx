"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  studentOnboardingMutationFn,
  instructorOnboardingMutationFn,
} from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader, Upload, FileText, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface OnboardingFormProps {
  email?: string;
  role?: string;
}

// Student onboarding data
interface StudentData {
  track: string;
  level: string;
  goal: string;
  experience: string;
  timeCommitment: string;
}

// Instructor onboarding data
interface InstructorData {
  track: string;
  experienceYears: string;
  bio: string;
  teachingStyle: string;
  motivation: string;
  cv: File | null;
}

const studentQuestions = [
  {
    id: "track" as const,
    label: "What track are you interested in?",
    placeholder: "e.g. Software Engineering, Data Science, Design",
    type: "text" as const,
  },
  {
    id: "level" as const,
    label: "What is your current level?",
    placeholder: "e.g. Beginner, Intermediate, Advanced",
    type: "text" as const,
  },
  {
    id: "goal" as const,
    label: "What is your primary learning goal?",
    placeholder: "e.g. Get hired as a full-stack developer",
    type: "text" as const,
  },
  {
    id: "experience" as const,
    label: "What is your experience background?",
    placeholder: "e.g. 2 years coding, no professional experience",
    type: "text" as const,
  },
  {
    id: "timeCommitment" as const,
    label: "How many hours per week can you commit?",
    placeholder: "e.g. 10 hours per week",
    type: "text" as const,
  },
];

const instructorQuestions = [
  {
    id: "track" as const,
    label: "What track will you teach?",
    placeholder: "e.g. Software Engineering, Data Science",
    type: "text" as const,
  },
  {
    id: "experienceYears" as const,
    label: "Years of teaching/professional experience",
    placeholder: "e.g. 5",
    type: "number" as const,
  },
  {
    id: "bio" as const,
    label: "Tell us about yourself (Bio)",
    placeholder: "Brief description of your background and expertise...",
    type: "textarea" as const,
  },
  {
    id: "teachingStyle" as const,
    label: "What is your teaching style?",
    placeholder: "e.g. Hands-on projects, Lecture-based, Interactive sessions",
    type: "text" as const,
  },
  {
    id: "motivation" as const,
    label: "Why do you want to teach on Vonova?",
    placeholder: "Share your motivation...",
    type: "textarea" as const,
  },
];

export function OnboardingForm({
  // email is kept for future extensibility but currently not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  email: _email,
  role,
}: OnboardingFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student state
  const [studentData, setStudentData] = useState<StudentData>({
    track: "",
    level: "",
    goal: "",
    experience: "",
    timeCommitment: "",
  });

  // Instructor state
  const [instructorData, setInstructorData] = useState<InstructorData>({
    track: "",
    experienceYears: "",
    bio: "",
    teachingStyle: "",
    motivation: "",
    cv: null,
  });

  const { mutateAsync: submitStudentOnboarding } = useMutation({
    mutationFn: studentOnboardingMutationFn,
  });

  const { mutateAsync: submitInstructorOnboarding } = useMutation({
    mutationFn: instructorOnboardingMutationFn,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unusedEmail = _email; // Kept for future use

  const isStudent = role === "STUDENT_USER";
  const isInstructor = role === "INSTRUCTOR_USER";

  const handleStudentChange = (field: keyof StudentData, value: string) => {
    setStudentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstructorChange = (
    field: keyof InstructorData,
    value: string | File | null
  ) => {
    setInstructorData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, DOC, and DOCX files are allowed");
        return;
      }
      setError(null);
      handleInstructorChange("cv", file);
    }
  };

  const clearFile = () => {
    handleInstructorChange("cv", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isStudent) {
        // Submit student onboarding
        await submitStudentOnboarding({
          track: studentData.track,
          level: studentData.level,
          goal: studentData.goal,
          experience: studentData.experience,
          timeCommitment: studentData.timeCommitment,
        });
      } else if (isInstructor) {
        // Validate CV is present
        if (!instructorData.cv) {
          setError("CV is required for instructor onboarding");
          setIsLoading(false);
          return;
        }

        // Build FormData for multipart upload
        const formData = new FormData();
        formData.append("track", instructorData.track);
        formData.append("experienceYears", instructorData.experienceYears);
        formData.append("bio", instructorData.bio);
        formData.append("teachingStyle", instructorData.teachingStyle);
        formData.append("motivation", instructorData.motivation);
        formData.append("cv", instructorData.cv);

        await submitInstructorOnboarding(formData);
      }

      // On success, invalidate auth query
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });

      // Show pending review toast for instructors
      if (isInstructor) {
        toast.success("Your account is pending review");
      }

      // Redirect based on role
      const targetPath = isInstructor ? "/" : "/auth/login";
      window.location.assign(targetPath);
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      setError(
        maybeAxios?.response?.data?.message || "Failed to complete onboarding"
      );
      setIsLoading(false);
    }
  };

  const renderStudentForm = () => (
    <div className="space-y-4">
      {studentQuestions.map((q) => (
        <div key={q.id} className="grid gap-2">
          <Label htmlFor={q.id}>{q.label}</Label>
          <Input
            id={q.id}
            type={q.type}
            placeholder={q.placeholder}
            value={studentData[q.id]}
            onChange={(e) => handleStudentChange(q.id, e.target.value)}
            required
          />
        </div>
      ))}
    </div>
  );

  const renderInstructorForm = () => (
    <div className="space-y-4">
      {instructorQuestions.map((q) => (
        <div key={q.id} className="grid gap-2">
          <Label htmlFor={q.id}>{q.label}</Label>
          {q.type === "textarea" ? (
            <Textarea
              id={q.id}
              placeholder={q.placeholder}
              value={instructorData[q.id] as string}
              onChange={(e) => handleInstructorChange(q.id, e.target.value)}
              required
              rows={3}
            />
          ) : (
            <Input
              id={q.id}
              type={q.type}
              placeholder={q.placeholder}
              value={instructorData[q.id] as string}
              onChange={(e) => handleInstructorChange(q.id, e.target.value)}
              required
            />
          )}
        </div>
      ))}

      {/* CV Upload */}
      <div className="grid gap-2">
        <Label htmlFor="cv">
          Upload CV <span className="text-red-500">*</span>
        </Label>
        <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
          {!instructorData.cv ? (
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                id="cv"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="cv"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload CV (PDF, DOC, DOCX, max 5MB)
                </span>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {instructorData.cv.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(instructorData.cv.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isStudent ? "Student" : "Instructor"} Profile
        </h1>
        <p className="text-muted-foreground">
          Complete your profile to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isStudent && renderStudentForm()}
        {isInstructor && renderInstructorForm()}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Privacy & Terms */}
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
