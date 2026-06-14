/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useQueryClient, UseMutateFunction } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "@/lib/stores";
import { createTree } from "@/lib/utils";
import type { RoadmapPayload } from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

type GenerateRoadmapResult = RoadmapPayload & {
  query?: string;
  chapters?: Record<string, unknown[]>;
  id?: string;
};

function peelGenerateResponse(raw: unknown): unknown {
  let v = raw;
  for (let i = 0; i < 5; i++) {
    if (!v || typeof v !== "object") break;
    const o = v as Record<string, unknown>;
    if (
      typeof o.roadmapId === "string" ||
      typeof o.id === "string" ||
      o.text ||
      (Array.isArray(o.tree) && o.tree.length > 0)
    ) {
      return v;
    }
    if ("data" in o) v = o.data as unknown;
    else break;
  }
  return v;
}
import {
  addRecentRoadmap,
  getRecentRoadmaps,
} from "@/utils/functions";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseUsageLimitError } from "@/utils/functions/app/usage-limit-error";
import { useAiCanUse, useConsumeAiCredits } from "@/hooks/app/community/use-social";
import { getFeatureCost } from "@/lib/ai/credits";

enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
}

interface Props {
  title?: string;
  roadmapId: string;
  isPending: boolean;
  dbRoadmapId: string;
  visibility?: Visibility;
  mutate: UseMutateFunction<any, AxiosError<unknown, any>, any, unknown>;
  step: 1 | 2 | 3 | 4;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  startTimer: () => void;
}

// Inline logic for isRoadmapGeneratedByUser
const isRoadmapGeneratedByUser = async (_dbRoadmapId: string) => ({
  isGeneratedByUser: false,
  isSavedByUser: false,
  isAuthor: false,
});

export const GeneratorControls = (props: Props) => {
  const { user } = useAuthContext();
  const userId = user?._id;
  const {
    title,
    mutate,
    roadmapId,
    isPending,
    dbRoadmapId,
    visibility: initialVisibility,
    step,
    setStep,
    startTimer,
  } = props;
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canSaveToDashboard, setCanSaveToDashboard] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const gate = useAiCanUse("MINDMAP_GENERATION");
  const consume = useConsumeAiCredits();
  const mindmapCost = getFeatureCost("MINDMAP_GENERATION");

  // Handlers for step transitions
  const handleTopicNext = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (topic.trim()) setStep(2);
  };
  const handleLevelNext = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (
      skillLevel === "beginner" ||
      skillLevel === "intermediate" ||
      skillLevel === "advanced"
    ) {
      setStep(3);
    }
  };
  const handleDurationNext = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (durationWeeks.trim()) setStep(4);
  };

  // Back logic: if input is empty and user presses Backspace, go back
  const handleBack = (currentStep: 2 | 3) => {
    if (currentStep === 2) setStep(1);
    if (currentStep === 3) setStep(2);
  };

  const { model, query, setModelApiKey, setQuery, modelApiKey, setRecentRoadmaps } =
    useUIStore(
    useShallow((state) => ({
      model: state.model,
      query: state.query,
      modelApiKey: state.modelApiKey,
      setModelApiKey: state.setModelApiKey,
      setQuery: state.setQuery,
      setRecentRoadmaps: state.setRecentRoadmaps,
    })),
  );

  useEffect(() => {
    // Set model API key from local storage
    const modelApiKey = localStorage.getItem(`${model.toUpperCase()}_API_KEY`);
    setModelApiKey(modelApiKey);

    const checkRoadmapStatus = async () => {
      if (dbRoadmapId) {
        const { isGeneratedByUser, isSavedByUser, isAuthor } =
          await isRoadmapGeneratedByUser(dbRoadmapId);
        setCanSaveToDashboard(!isGeneratedByUser && !isSavedByUser);
        setShowVisibilityDropdown(isGeneratedByUser);
        setIsAuthor(isAuthor);
      }
    };
    checkRoadmapStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, dbRoadmapId, roadmapId, setModelApiKey, router]);

  const onSubmit = async (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    startTimer();
    try {
      if (!topic || !skillLevel || !durationWeeks) {
        return toast.error("Please fill all fields", {
          description: "Topic, skill level, and duration are required.",
          duration: 4000,
        });
      }

      const allowedSkill = ["beginner", "intermediate", "advanced"] as const;
      if (!allowedSkill.includes(skillLevel as (typeof allowedSkill)[number])) {
        return toast.error("Invalid skill level", {
          description: "Choose Beginner, Intermediate, or Advanced.",
          duration: 4000,
        });
      }

      const durationWeeksNum = parseInt(durationWeeks);
      if (isNaN(durationWeeksNum) || durationWeeksNum < 1 || durationWeeksNum > 12) {
        return toast.error("Invalid duration", {
          description: "Duration must be between 1 and 12 weeks.",
          duration: 4000,
        });
      }

      if (gate.data?.allowed === false) {
        toast.error("Not enough AI credits", {
          description: `Mindmap generation costs ${mindmapCost} credits. You have ${(gate.data.remaining ?? 0).toLocaleString()} credits remaining this month.`,
          duration: 6000,
        });
        return;
      }
      // Optionally, add profanity or validation checks here for topic
      toast.info("Generating roadmap", {
        description: "We are generating a roadmap for you.",
        duration: 4000,
      });
      setIsGenerating(true);
      mutate(
        {
          body: {
            topic,
            skill_level: skillLevel,
            duration_weeks: parseInt(durationWeeks),
          },
        },
        {
          onSuccess: (raw: unknown) => {
            void queryClient.invalidateQueries({ queryKey: ["user-roadmaps"] });
            consume.mutate({
              feature: "MINDMAP_GENERATION",
              creditsUsed: mindmapCost,
            });
            toast.success("Success", {
              description: "Roadmap generated successfully.",
              duration: 4000,
            });
            const data = peelGenerateResponse(raw) as GenerateRoadmapResult | null;
            if (!data) {
              toast.error("Could not open roadmap", {
                description: "The server returned an unexpected shape.",
                duration: 5000,
              });
              return;
            }
            const rawId =
              (data && typeof data.roadmapId === "string" && data.roadmapId) ||
              (data && typeof data.id === "string" && data.id) ||
              "";
            if (!rawId || !userId) {
              toast.error("Could not open roadmap", {
                description: "The server response did not include a roadmap id.",
                duration: 5000,
              });
              return;
            }

            let tree: unknown[] | null = null;
            if (Array.isArray(data?.tree) && data.tree.length > 0) {
              tree = data.tree as unknown[];
            } else if (
              data?.text?.query &&
              data.text.chapters &&
              typeof data.text.chapters === "object" &&
              Object.keys(data.text.chapters).length > 0
            ) {
              tree = createTree(data.text);
            } else if (
              typeof data?.query === "string" &&
              data.chapters &&
              typeof data.chapters === "object" &&
              Object.keys(data.chapters).length > 0
            ) {
              tree = createTree({
                query: data.query,
                chapters: data.chapters as Record<string, any[]>,
              });
            }

            if (tree?.length) {
              const cached = { content: tree, visibility: "public" as const };
              localStorage.setItem(rawId, JSON.stringify(cached));
              queryClient.setQueryData(["Roadmap", rawId], cached);
              addRecentRoadmap({
                id: rawId,
                title: (tree[0] as { name?: string })?.name || "Untitled",
                date: new Date().toLocaleDateString(),
                icon: "/images/placeholder.svg",
              });
              setRecentRoadmaps(getRecentRoadmaps());
            }
            setTimeout(() => {
              router.push(`/student/${userId}/ai-roadmap-generator/${rawId}`);
            }, 100);
          },
          onError: (error: any) => {
            const parsed = parseUsageLimitError(error);
            toast.error(parsed.title, {
              description: parsed.description,
              duration: 4000,
            });
          },
          onSettled: () => {
            setIsGenerating(false);
          },
        },
      );
    } catch (e: any) {
      console.error("api error", e);
      setIsGenerating(false);
    }
  };

  // Inline logic for changeRoadmapVisibility
  const changeRoadmapVisibility = async (
    _dbRoadmapId: string,
    _value: any,
  ) => { };

  // Utility function to format visibility
  const formatVisibility = (visibility?: Visibility) => {
    switch (visibility) {
      case Visibility.PUBLIC:
        return "Public";
      case Visibility.PRIVATE:
        return "Private";
      default:
        return "Loading";
    }
  };

  const onValueChange = async (value: Visibility) => {
    await changeRoadmapVisibility(dbRoadmapId, value);
    setVisibility(value); // Update visibility state
  };

  return (
    <form className="w-full" autoComplete="off" onSubmit={onSubmit}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTopicNext(e);
              }}
              placeholder="What do you want to learn? (e.g. Backend, React, Data Science)"
              className="w-full text-base md:text-lg p-4 rounded-none border-none bg-transparent text-foreground placeholder-muted-foreground font-medium focus:outline-none focus:ring-0"
              disabled={isPending || isGenerating}
              autoFocus
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Select
              value={skillLevel || undefined}
              onValueChange={setSkillLevel}
              disabled={isPending || isGenerating}
            >
              <SelectTrigger
                autoFocus
                className="h-auto w-full border-none bg-transparent px-0 py-4 text-base font-medium text-foreground shadow-none focus:ring-0 md:text-lg [&>span]:text-muted-foreground data-placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLevelNext(e);
                  if (e.key === "Backspace" && !skillLevel) handleBack(2);
                }}
              >
                <SelectValue placeholder="Choose your skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Input
              type="number"
              min="1"
              max="12"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDurationNext(e);
                if (e.key === "Backspace" && durationWeeks === "")
                  handleBack(3);
              }}
              placeholder="Duration (weeks)"
              className="w-full text-base md:text-lg p-4 rounded-none border-none bg-transparent text-foreground placeholder-muted-foreground font-medium focus:outline-none focus:ring-0"
              disabled={isPending || isGenerating}
              autoFocus
            />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg shadow hover:bg-primary/90 transition disabled:opacity-60"
              disabled={
                isPending ||
                isGenerating ||
                gate.data?.allowed === false ||
                gate.isLoading
              }
            >
              {isPending || isGenerating ? "Generating..." : "Generate"}
            </button>
            <p className="mt-3 max-w-md text-center text-xs text-muted-foreground">
              This action costs {mindmapCost} AI credits
              {typeof gate.data?.remaining === "number"
                ? ` · You have ${gate.data.remaining.toLocaleString()} credits remaining this month`
                : ""}
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
