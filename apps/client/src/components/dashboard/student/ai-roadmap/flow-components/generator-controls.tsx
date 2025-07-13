/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  changeRoadmapVisibility,
  checkIfTitleInUsersRoadmaps,
  deleteRoadmapById,
  isRoadmapGeneratedByUser,
  saveToUserDashboard,
} from "@/actions/roadmaps";
import ApiKeyDialog from "../ApiKeyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Visibility } from "@prisma/client";
import { UseMutateFunction } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Save, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useUIStore } from "@/lib/stores";
import { createTree } from "@/lib/utils";

interface Props {
  title?: string;
  roadmapId: string;
  isPending: boolean;
  dbRoadmapId: string;
  visibility?: Visibility;
  mutate: UseMutateFunction<any, AxiosError<unknown, any>, any, unknown>;
}

export const GeneratorControls = (props: Props) => {
  const {
    title,
    mutate,
    roadmapId,
    isPending,
    dbRoadmapId,
    visibility: initialVisibility,
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
      router.push(`/roadmap/${roadmapId}`);
    }
  }, [model, dbRoadmapId, roadmapId, setModelApiKey]);

  const onSubmit = async (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
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
            // Save to localStorage before redirect
            const id = data?.roadmapId || data?.id;
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
                JSON.stringify({ content: tree, visibility: "public" })
              );
              router.push(`/roadmap/${id}`);
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

  const onValueChange = async (value: Visibility) => {
    await changeRoadmapVisibility(dbRoadmapId, value);
    setVisibility(value); // Update visibility state
  };

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

  const handleDelete = async () => {
    if (isAuthor) {
      const response = await deleteRoadmapById(dbRoadmapId);

      if (response.status === "success") {
        toast.success("Deleted", {
          description: "Roadmap deleted successfully ",
          duration: 4000,
        });
        router.push("/dashboard" as any);
        router.refresh();
      } else {
        toast.error("Error", {
          description: response.message,
          duration: 4000,
        });
      }
    } else {
      toast.error("Unauthorized", {
        description: "You are not authorized to delete this roadmap.",
        duration: 4000,
      });
    }
  };

  const handleSaveToDashboard = async () => {
    if (canSaveToDashboard) {
      const response = await saveToUserDashboard(dbRoadmapId);
      if (response?.status === "success") {
        toast.success("Saved", {
          description: "Roadmap has been saved to your dashboard",
          duration: 4000,
        });
        setCanSaveToDashboard(false);
      } else {
        toast.error("Error", {
          description: response?.message,
          duration: 4000,
        });
      }
    }
  };

  const disableUI = isGenerating || isPending;

  return (
    <form
      className="w-full flex flex-col items-center"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      {/* Large Topic Input */}
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter your learning topic (e.g. Backend, React, Data Science)"
        className="w-full text-base md:text-lg px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-black/10 focus:outline-none bg-gray-50 placeholder-gray-400 mb-3"
        disabled={isPending || isGenerating}
      />
      {/* Level and Duration Inputs Row */}
      <div className="w-full flex flex-col md:flex-row gap-2 mb-3">
        <input
          type="text"
          value={skillLevel}
          onChange={e => setSkillLevel(e.target.value)}
          placeholder="Skill Level (e.g. Beginner, Intermediate, Advanced)"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-black/10 focus:outline-none bg-gray-50 placeholder-gray-400"
          disabled={isPending || isGenerating}
        />
        <input
          type="number"
          min="1"
          value={durationWeeks}
          onChange={e => setDurationWeeks(e.target.value)}
          placeholder="Duration (weeks)"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-black/10 focus:outline-none bg-gray-50 placeholder-gray-400"
          disabled={isPending || isGenerating}
        />
      </div>
      {/* Generate Button */}
      <button
        type="submit"
        className="w-full md:w-auto px-6 py-2 rounded-xl bg-black text-white font-semibold text-base shadow-md hover:bg-gray-900 transition disabled:opacity-60"
        disabled={isPending || isGenerating}
      >
        {isPending || isGenerating ? "Generating..." : "Generate"}
      </button>
      {/* Remove Add Key button and other non-essential controls for a clean UI */}
    </form>
  );
};
