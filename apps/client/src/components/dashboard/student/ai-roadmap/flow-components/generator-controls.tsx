/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { UseMutateFunction } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "@/lib/stores";
import { createTree, getDisplayRoadmapId } from "@/lib/utils";
import {
  addRecentRoadmap,
  getRecentRoadmaps,
} from "@/utils/functions/local-storage";
import { motion, AnimatePresence } from "framer-motion";

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
  const [topic, setTopic] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const { setRecentRoadmaps } = useUIStore();

  // Handlers for step transitions
  const handleTopicNext = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (topic.trim()) setStep(2);
  };
  const handleLevelNext = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (skillLevel.trim()) setStep(3);
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

  const { model, query, setModelApiKey, setQuery, modelApiKey } = useUIStore(
    useShallow((state) => ({
      model: state.model,
      query: state.query,
      modelApiKey: state.modelApiKey,
      setModelApiKey: state.setModelApiKey,
      setQuery: state.setQuery,
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

    // Redirect if roadmapId changes
    if (roadmapId) {
      router.push(`/dashboard/ai-roadmap-generator/${roadmapId}`);
    }
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
      setIsGenerating(true);
      if (!topic || !skillLevel || !durationWeeks) {
        return toast.error("Please fill all fields", {
          description: "Topic, skill level, and duration are required.",
          duration: 4000,
        });
      }
      // Optionally, add profanity or validation checks here for topic
      toast.info("Generating roadmap", {
        description: "We are generating a roadmap for you.",
        duration: 4000,
      });
      mutate(
        {
          body: {
            topic,
            skill_level: skillLevel,
            duration_weeks: durationWeeks,
          },
        },
        {
          onSuccess: (data: any) => {
            toast.success("Success", {
              description: "Roadmap generated successfully.",
              duration: 4000,
            });
            let id = data?.roadmapId || data?.id;
            id = getDisplayRoadmapId(id);
            let tree = null;
            if (data.query && data.chapters) {
              tree = [createTree(data)[0]];
            } else if (data.text && data.text.query && data.text.chapters) {
              tree = [createTree(data.text)[0]];
            } else if (data.tree && Array.isArray(data.tree)) {
              tree = data.tree;
            }
            if (id && tree) {
              localStorage.setItem(
                id,
                JSON.stringify({ content: tree, visibility: "public" }),
              );
              addRecentRoadmap({
                id,
                title: tree?.[0]?.name || "Untitled",
                date: new Date().toLocaleDateString(),
                icon: "/images/placeholder.svg",
              });
              setRecentRoadmaps(getRecentRoadmaps());
              // Add a short delay before redirecting to ensure localStorage is updated
              setTimeout(() => {
                router.push(`/dashboard/ai-roadmap-generator/${id}`);
              }, 100);
            }
          },
          onError: (error: any) => {
            toast.error("Something went wrong", {
              description:
                error.response?.data?.message || "Unknown error occurred",
              duration: 4000,
            });
          },
        },
      );
    } catch (e: any) {
      console.error("api error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Inline logic for changeRoadmapVisibility
  const changeRoadmapVisibility = async (
    _dbRoadmapId: string,
    _value: any,
  ) => {};

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
            <input
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
            <input
              type="text"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLevelNext(e);
                if (e.key === "Backspace" && skillLevel === "") handleBack(2);
              }}
              placeholder="Skill Level (e.g. Beginner, Intermediate, Advanced)"
              className="w-full text-base md:text-lg p-4 rounded-none border-none bg-transparent text-foreground placeholder-muted-foreground font-medium focus:outline-none focus:ring-0"
              disabled={isPending || isGenerating}
              autoFocus
            />
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
            <input
              type="number"
              min="1"
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
              disabled={isPending || isGenerating}
            >
              {isPending || isGenerating ? "Generating..." : "Generate"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
