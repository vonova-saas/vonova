/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import ExpandCollapse from "../flow-components/expand-collapse";
import { useGenerateRoadmap } from "@/lib/queries";
import { createTree, isLikelyRoadmapUuid } from "@/lib/utils";
import {
  deleteRoadmapMutationFn,
  getRoadmapByIdMutationFn,
  getUserRoadmapsMutationFn,
} from "@/services/student/lms-ai/roadmap-generator/roadmap.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileDown,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  PlusCircle,
  Share2,
  Sparkles,
  Trash,
} from "lucide-react";
import { GeneratorControls } from "../flow-components/generator-controls";
import { useUIStore } from "@/lib/stores/useUI";
import Instructions from "../flow-components/Instructions";
import React, { useRef } from "react";

enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private"
}

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { downloadImage } from "@/lib/utils";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { LocalStorage } from "@/utils/functions";
import { getDisplayRoadmapId } from '@/lib/utils';
import { shouldBypassNextImageOptimization } from "@/lib/lms/course-thumbnail";
import { getRecentRoadmaps, removeRecentRoadmap } from '@/utils/functions';
import useUserId from "@/hooks/user/use-user-id";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import type {
  RoadmapPayload,
  UserRoadmapListItem,
} from "@/types/api/student/lms-ai/roadmap-generator/roadmap.type";

/** Generate response may match `RoadmapPayload` or older flat `{ query, chapters }` shapes. */
type GenerateRoadmapResult = RoadmapPayload & {
  query?: string;
  chapters?: Record<string, any[]>;
  id?: string;
};

const USER_ROADMAPS_PAGE_SIZE = 8;

function parseStoredRoadmap(
  roadmapId?: string,
): { content?: any; visibility?: string } | null {
  if (!roadmapId || typeof window === "undefined") return null;
  const roadmapData = LocalStorage.get(roadmapId);
  if (!roadmapData) return null;
  if (typeof roadmapData === "string") {
    try {
      return JSON.parse(roadmapData) as { content?: any; visibility?: string };
    } catch {
      return null;
    }
  }
  return roadmapData as { content?: any; visibility?: string };
}

function formatRoadmapListDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function Roadmap({ roadmapId }: { roadmapId?: string }) {
  // Stepper state for progress indicator (must be before any conditional return)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { query } = useUIStore();
  const [localRoadmap, setLocalRoadmap] = useState<{
    content?: any;
    visibility?: string;
  } | null>(() => parseStoredRoadmap(roadmapId));
  const [localStorageChecked, setLocalStorageChecked] = useState(
    () => !roadmapId || typeof window !== "undefined",
  );
  const router = useRouter();
  const { recentRoadmaps, setRecentRoadmaps } = useUIStore();
  const [timer, setTimer] = useState(0); // seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isGeneratingTimer, setIsGeneratingTimer] = useState(false);
  const TIMER_MAX = 50; // or 20 for 20 seconds
  const userId = useUserId();
  const auth = useAuthContextOptional();
  const authUserId = auth?.user?._id as string | undefined;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const listPageRaw = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  const { data: userRoadmapsRes, isPending: isUserRoadmapsPending } = useQuery(
    {
      queryKey: ["user-roadmaps"],
      queryFn: getUserRoadmapsMutationFn,
      enabled: Boolean(!roadmapId && authUserId),
      staleTime: 30_000,
    },
  );

  const userRoadmapsAll: UserRoadmapListItem[] = useMemo(() => {
    const raw = userRoadmapsRes?.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (r): r is UserRoadmapListItem =>
        Boolean(r && typeof r === "object" && "roadmapId" in r),
    );
  }, [userRoadmapsRes]);

  const userRoadmapsTotalPages =
    userRoadmapsAll.length === 0
      ? 0
      : Math.ceil(userRoadmapsAll.length / USER_ROADMAPS_PAGE_SIZE);

  const safeListPage =
    userRoadmapsTotalPages === 0
      ? 1
      : Math.min(listPageRaw, userRoadmapsTotalPages);

  useEffect(() => {
    if (roadmapId || userRoadmapsTotalPages === 0) return;
    if (listPageRaw !== safeListPage) {
      const p = new URLSearchParams(searchParams.toString());
      if (safeListPage <= 1) p.delete("page");
      else p.set("page", String(safeListPage));
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }
  }, [
    listPageRaw,
    pathname,
    roadmapId,
    router,
    safeListPage,
    searchParams,
    userRoadmapsTotalPages,
  ]);

  const userRoadmapsPageSlice = useMemo(() => {
    const start = (safeListPage - 1) * USER_ROADMAPS_PAGE_SIZE;
    return userRoadmapsAll.slice(start, start + USER_ROADMAPS_PAGE_SIZE);
  }, [safeListPage, userRoadmapsAll]);

  const setUserRoadmapsPage = (next: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next <= 1) p.delete("page");
    else p.set("page", String(next));
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const handleDeleteServerRoadmap = async (
    e: React.MouseEvent,
    item: UserRoadmapListItem,
  ) => {
    e.stopPropagation();
    try {
      await deleteRoadmapMutationFn(item.roadmapId);
      removeRecentRoadmap(getDisplayRoadmapId(item.roadmapId));
      removeRecentRoadmap(item.roadmapId);
      if (typeof window !== "undefined") {
        LocalStorage.remove(getDisplayRoadmapId(item.roadmapId));
        LocalStorage.remove(item.roadmapId);
      }
      setRecentRoadmaps(getRecentRoadmaps());
      await queryClient.invalidateQueries({ queryKey: ["user-roadmaps"] });
      toast.success("Roadmap removed");
    } catch {
      toast.error("Could not delete roadmap");
    }
  };

  // Helper to load recent roadmaps from localStorage
  const loadRecentRoadmaps = () => {
    const roadmaps = getRecentRoadmaps();
    setRecentRoadmaps(roadmaps);
    return roadmaps;
  };

  // Load recent roadmaps on mount
  useEffect(() => {
    loadRecentRoadmaps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete roadmap handler
  const handleDeleteRoadmap = (id: string) => {
    removeRecentRoadmap(id);
    if (typeof window !== "undefined") {
      LocalStorage.remove(id);
    }
    setRecentRoadmaps(getRecentRoadmaps());
  };

  // 1. Sync localStorage when roadmap id changes (before paint to avoid spinner flash)
  useLayoutEffect(() => {
    if (!roadmapId) {
      setLocalRoadmap(null);
      setLocalStorageChecked(true);
      return;
    }
    if (typeof window === "undefined") return;
    setLocalRoadmap(parseStoredRoadmap(roadmapId));
    setLocalStorageChecked(true);
  }, [roadmapId]);

  // 2. Fallback: full UUID in URL → GET /api/v1/roadmap/:id (cookie auth)
  const { data: remoteRoadmap, isPending: isRoadmapPending } = useQuery<{
    content?: any;
    visibility?: string;
  } | null>({
    queryFn: async () => {
      if (!roadmapId || !isLikelyRoadmapUuid(roadmapId)) return null;
      const payload = await getRoadmapByIdMutationFn(roadmapId);
      if (payload?.text?.query && payload.text.chapters) {
        return {
          content: createTree(payload.text),
          visibility: "public",
        };
      }
      if (Array.isArray(payload?.tree) && payload.tree.length > 0) {
        return {
          content: payload.tree,
          visibility: "public",
        };
      }
      return null;
    },
    queryKey: ["Roadmap", roadmapId],
    enabled: Boolean(
      roadmapId &&
        localStorageChecked &&
        !localRoadmap &&
        isLikelyRoadmapUuid(roadmapId),
    ),
  });

  // 3. Handle roadmap generation
  const { data, mutate, isPending } = useGenerateRoadmap();

  // 4. Compose the data array for ExpandCollapse (mutation data only if it matches URL id)
  let generatedTree: any = undefined;
  if (data) {
    const d = data as GenerateRoadmapResult;
    if (d.query && d.chapters) {
      generatedTree = createTree({ query: d.query, chapters: d.chapters })[0];
    } else if (d.text?.query && d.text.chapters) {
      generatedTree = createTree({
        query: d.text.query,
        chapters: d.text.chapters,
      })[0];
    } else if (d.tree && Array.isArray(d.tree)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      generatedTree = d.tree[0];
    }
  }

  const mutationRoadmapContent = (() => {
    const d = data as GenerateRoadmapResult | undefined;
    if (!d) return undefined;
    if (roadmapId) {
      const mid = d.roadmapId ?? d.id;
      if (mid && mid !== roadmapId) return undefined;
    }
    if (d.query && d.chapters) {
      return createTree({ query: d.query, chapters: d.chapters });
    }
    if (d.text?.query && d.text.chapters) {
      return createTree({ query: d.text.query, chapters: d.text.chapters });
    }
    if (Array.isArray(d.tree) && d.tree.length > 0) return d.tree;
    return undefined;
  })();

  // 5. Decide what to render
  const roadmapContent =
    mutationRoadmapContent ||
    (localRoadmap?.content ? localRoadmap.content : undefined) ||
    (remoteRoadmap?.content ? remoteRoadmap.content : undefined);

  const treeReady = Boolean(roadmapContent && roadmapContent[0]);
  const showRoadmapDetailLoader = Boolean(
    roadmapId &&
      !treeReady &&
      (!localStorageChecked || isRoadmapPending),
  );

  // Onboarding state
  const ONBOARDING_KEY = "roadmap-onboarding-complete";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const onboardingSteps = [
    {
      title: "Welcome to the AI Roadmap Generator!",
      desc: "This tool helps you create a personalized learning roadmap for any topic. Let’s take a quick tour!",
    },
    {
      title: "Generate Your Roadmap",
      desc: "Use the generator card to enter your topic, skill level, and duration. Click Generate to get your roadmap!",
    },
    {
      title: "Customize Your Experience",
      desc: "Click the palette icon to personalize your roadmap’s colors and background pattern.",
    },
    {
      title: "Export, Share, or Save",
      desc: "Use the buttons at the top right to export as PDF/image, share, or save your roadmap.",
    },
    {
      title: "Explore Your Roadmap",
      desc: "Click nodes to expand and dive deeper into your learning path. Happy learning!",
    },
  ];
  // Show onboarding if not completed
  useEffect(() => {
    if (typeof window !== 'undefined' && !LocalStorage.get(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);
  const handleNextOnboarding = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      LocalStorage.set(ONBOARDING_KEY, "true");
    }
  };
  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    LocalStorage.set(ONBOARDING_KEY, "true");
  };

  // Start/stop timer based on step
  useEffect(() => {
    if (step === 4 && !roadmapId) {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev < TIMER_MAX) return prev + 1;
          if (timerRef.current) clearInterval(timerRef.current);
          return TIMER_MAX;
        });
      }, 1000);
    } else {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, roadmapId]);

  // Start timer when requested
  const startTimer = () => {
    setTimer(0);
    setIsGeneratingTimer(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev < TIMER_MAX) return prev + 1;
        if (timerRef.current) clearInterval(timerRef.current);
        setIsGeneratingTimer(false);
        return TIMER_MAX;
      });
    }, 1000);
  };

  // If viewing a specific roadmap (roadmapId is present), show the roadmap with Save/Back buttons
  if (roadmapId) {
    return (
      <div className="min-h-full w-full pb-16 relative">
        <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
          <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Student hub
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">AI Roadmap Generator</h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Explore your generated learning path and refine it as you progress.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 pt-10">
        {/* Beautiful Header */}
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center mt-16 mb-8 px-4">
          <div className="flex flex-col items-center">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary mb-3 drop-shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center mb-2 drop-shadow">Your Personalized Roadmap</h1>
            <p className="text-base md:text-lg text-muted-foreground text-center mb-2 max-w-xl">Explore your generated learning path below. You can save it, share it, or go back to generate a new one!</p>
            <div className="w-20 h-1 rounded-full bg-primary/30 mx-auto mb-2" />
          </div>
        </div>
        {/* Save and Back Buttons - now in normal flow */}
        <div className="w-full max-w-4xl flex flex-row items-center justify-between gap-4 mb-6 px-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition border border-primary/40 backdrop-blur-md bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('save-roadmap', { detail: roadmapId }));
            }}
            aria-label="Save roadmap"
          >
            Save
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-3 rounded-xl bg-muted text-foreground font-semibold shadow-lg hover:bg-muted/80 transition border border-border backdrop-blur-md bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            Back
          </motion.button>
        </div>
        {/* Roadmap Visualization Glassy Card */}
        <div className="flex flex-1 items-center justify-center w-full min-h-[60vh] px-2 pb-10">
          <div className="w-full max-w-6xl bg-card/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-border p-2 sm:p-6 md:p-10 flex flex-col items-center justify-center glassmorphism-card transition-all duration-300 mx-auto relative">
            {/* Export/Share Button Group */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              {/* Export as pdf Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-background/70 border border-border shadow hover:bg-primary/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Export as PDF"
                aria-label="Export roadmap as PDF"
                onClick={async () => {
                  const el = document.querySelector('.react-flow__viewport') as HTMLElement;
                  if (!el) {
                    toast.error('Could not find roadmap viewport to export.');
                    return;
                  }
                  try {
                    const dataUrl = await toPng(el, { backgroundColor: 'transparent' });
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [el.offsetWidth, el.offsetHeight] });
                    pdf.addImage(dataUrl, 'PNG', 0, 0, el.offsetWidth, el.offsetHeight);
                    pdf.save(`${roadmapId}.pdf`);
                    toast.success('PDF exported successfully!');
                  } catch {
                    toast.error('Failed to export PDF.');
                  }
                }}
              >
                <FileDown className="w-5 h-5 text-primary" />
              </motion.button>
              {/* Export as Image Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-background/70 border border-border shadow hover:bg-primary/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Export as Image"
                aria-label="Export roadmap as image"
                onClick={async () => {
                  const el = document.querySelector('.react-flow__viewport') as HTMLElement;
                  if (!el) {
                    alert('Could not find roadmap viewport to export.');
                    return;
                  }
                  try {
                    const dataUrl = await toPng(el, { backgroundColor: 'transparent' });
                    downloadImage(dataUrl);
                  } catch {
                    alert('Failed to export image.');
                  }
                }}
              >
                <ImageIcon className="w-5 h-5 text-primary" />
              </motion.button>
              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-background/70 border border-border shadow hover:bg-primary/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Share Link"
                aria-label="Copy roadmap ID to clipboard"
                onClick={async () => {
                  try {
                    if (!roadmapId) {
                      toast.error('No roadmap ID to copy.');
                      return;
                    }
                    await navigator.clipboard.writeText(roadmapId);
                    toast.success('Roadmap ID copied to clipboard!');
                  } catch {
                    toast.error('Failed to copy roadmap ID.');
                  }
                }}
              >
                <Share2 className="w-5 h-5 text-primary" />
              </motion.button>
            </div>
            {showRoadmapDetailLoader ? (
              <div className="flex justify-center items-center w-full h-64">
                <Loader2 className="animate-spin w-10 h-10 text-primary/60" />
              </div>
            ) : treeReady ? (
              <div className="w-full">
                <ExpandCollapse
                  data={roadmapContent}
                  isPending={false}
                  roadmapId={roadmapId}
                />
              </div>
            ) : (
              <Instructions />
            )}
          </div>
        </div>
        {/* Onboarding Popover/Modal */}
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-popover border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center animate-fade-in">
              <div className="text-xl font-bold mb-2 text-primary text-center">{onboardingSteps[onboardingStep].title}</div>
              <div className="text-base text-muted-foreground mb-6 text-center">{onboardingSteps[onboardingStep].desc}</div>
              <div className="flex gap-3 w-full justify-center">
                <button
                  className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium border border-border hover:bg-muted/80 transition"
                  onClick={handleSkipOnboarding}
                >
                  Skip
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold border border-primary hover:bg-primary/90 transition"
                  onClick={handleNextOnboarding}
                >
                  {onboardingStep === onboardingSteps.length - 1 ? "Got it!" : "Next"}
                </button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Step {onboardingStep + 1} of {onboardingSteps.length}</div>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  // Main layout
  return (
    <div className="min-h-full w-full pb-16 relative">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Student hub
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">AI Roadmap Generator</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Enter your topic and preferences to generate a personalized learning roadmap.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 pt-10">
      {/* Stepper/Progress Indicator OUTSIDE the card */}
      <div className="flex flex-col items-center w-full mb-4">
        <div className="flex items-center justify-center w-full max-w-md mx-auto">
          {[1, 2, 3, 4].map((s, idx) => (
            <React.Fragment key={s}>
              <motion.div
                layout
                className={`flex flex-col items-center z-10`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                    ${(Number(step) === s) ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-muted text-muted-foreground border-muted-foreground'}
                  `}
                >
                  <span className="font-semibold text-sm">{s}</span>
                </div>
                <span className={`mt-1 text-xs font-medium ${(Number(step) === s) ? 'text-primary' : 'text-muted-foreground'}`}>{
                  s === 1 ? 'Topic' : s === 2 ? 'Level' : s === 3 ? 'Duration' : 'Generate'
                }</span>
              </motion.div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${(Number(step) > s) ? 'bg-primary' : 'bg-muted'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="w-full max-w-md h-2 mt-2 mb-4 border-b border-muted" />
      </div>
      {/* Generator Card */}
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl px-6 py-8 flex flex-col items-center border border-border">
          <GeneratorControls
            mutate={mutate}
            isPending={isPending}
            roadmapId={data?.roadmapId ?? ""}
            dbRoadmapId={roadmapId || ""}
            visibility={
              (typeof remoteRoadmap?.visibility === "string" &&
                (remoteRoadmap.visibility === Visibility.PUBLIC ||
                  remoteRoadmap.visibility === Visibility.PRIVATE))
                ? (remoteRoadmap.visibility as Visibility)
                : localRoadmap &&
                    (localRoadmap.visibility === Visibility.PUBLIC ||
                      localRoadmap.visibility === Visibility.PRIVATE)
                  ? (localRoadmap.visibility as Visibility)
                  : Visibility.PUBLIC
            }
            title={query}
            key={
              (typeof remoteRoadmap?.visibility === "string" &&
                (remoteRoadmap.visibility === Visibility.PUBLIC ||
                  remoteRoadmap.visibility === Visibility.PRIVATE))
                ? (remoteRoadmap.visibility as Visibility)
                : localRoadmap &&
                    (localRoadmap.visibility === Visibility.PUBLIC ||
                      localRoadmap.visibility === Visibility.PRIVATE)
                  ? (localRoadmap.visibility as Visibility)
                  : Visibility.PUBLIC
            }
            step={step}
            setStep={setStep}
            startTimer={startTimer}
          />
        </div>
      </div>
      {/* Timer under Generator Card */}
      {isGeneratingTimer && (
        <div className="flex flex-col items-center justify-center mt-2 mb-4">
          <span className="text-lg font-mono text-foreground">
            {`00:${timer.toString().padStart(2, '0')}`}
            <span className="text-base font-normal text-muted-foreground ml-2">Estimated time: 20 seconds</span>
          </span>
        </div>
      )}
      {/* Your roadmaps (API) — paginated in the URL as ?page= (client-side over full list) */}
      <div className="w-full max-w-6xl mx-auto px-2 pb-6 mt-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Your roadmaps
            </h2>
          </div>
          {authUserId && userRoadmapsAll.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Page {safeListPage} of {userRoadmapsTotalPages} ·{" "}
              {userRoadmapsAll.length} total
            </p>
          ) : null}
        </div>
        <div className="w-16 h-1 rounded-full bg-primary/20 mb-6" />
        {!authUserId ? (
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to load roadmaps saved to your account from this device.
          </p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            className="relative flex flex-col items-center justify-center h-48 bg-card rounded-2xl shadow-lg border-2 border-dashed border-primary/30 cursor-pointer hover:shadow-xl hover:scale-[1.03] transition group overflow-hidden"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="flex items-center justify-center mb-3">
                <PlusCircle className="w-10 h-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
              </div>
              <div className="font-medium text-base text-foreground">
                Create New Project
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Start a new learning journey
              </div>
            </div>
          </div>
          {authUserId && isUserRoadmapsPending ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            </div>
          ) : null}
          {authUserId &&
          !isUserRoadmapsPending &&
          userRoadmapsAll.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
              <div className="text-lg font-medium text-muted-foreground mb-1">
                No saved roadmaps yet
              </div>
              <div className="text-sm text-muted-foreground text-center max-w-md">
                Generate a roadmap above — it will show here once the server
                saves it to your account.
              </div>
            </div>
          ) : null}
          {authUserId
            ? userRoadmapsPageSlice.map((item) => {
                const title =
                  item.title?.trim() ||
                  item.topic?.trim() ||
                  "Untitled roadmap";
                const updated =
                  item.updated_at || item.created_at || undefined;
                return (
                  <div
                    key={item.roadmapId}
                    className="relative flex flex-col items-center justify-center h-48 bg-card rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition group overflow-hidden cursor-pointer border border-border"
                    onClick={() =>
                      router.push(
                        `/student/${userId}/ai-roadmap-generator/${item.roadmapId}`,
                      )
                    }
                  >
                    <button
                      type="button"
                      className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 bg-muted hover:bg-red-500 hover:text-white text-muted-foreground rounded-full p-2 shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={(e) => handleDeleteServerRoadmap(e, item)}
                      aria-label="Delete roadmap"
                    >
                      <Trash size={18} />
                    </button>
                    <div className="flex items-center justify-center mb-2 mt-2">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border shadow overflow-hidden">
                        <Image
                          src="/images/placeholder.svg"
                          alt=""
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-full bg-background"
                        />
                      </div>
                    </div>
                    <div
                      className="text-base font-semibold text-foreground mb-1 text-center px-2 truncate w-full"
                      title={title}
                    >
                      {title}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Updated {formatRoadmapListDate(updated)}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      ID: {getDisplayRoadmapId(item.roadmapId)}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
        {authUserId &&
        !isUserRoadmapsPending &&
        userRoadmapsTotalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeListPage <= 1}
              onClick={() => setUserRoadmapsPage(safeListPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {safeListPage} / {userRoadmapsTotalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeListPage >= userRoadmapsTotalPages}
              onClick={() => setUserRoadmapsPage(safeListPage + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* On this device (localStorage) */}
      <div className="w-full max-w-6xl mx-auto px-2 pb-10 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            On this device
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Recently opened roadmaps stored in your browser (may overlap with the
          list above).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentRoadmaps.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                No local previews yet.
              </div>
            </div>
          ) : (
            recentRoadmaps.map((rm) => (
              <div
                key={rm.id}
                className="relative flex flex-col items-center justify-center h-48 bg-card rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition group overflow-hidden cursor-pointer border border-border"
                onClick={() =>
                  router.push(
                    `/student/${userId}/ai-roadmap-generator/${rm.id}`,
                  )
                }
              >
                <button
                  type="button"
                  className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 bg-muted hover:bg-red-500 hover:text-white text-muted-foreground rounded-full p-2 shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoadmap(rm.id);
                  }}
                  aria-label="Delete roadmap from this device"
                >
                  <Trash size={18} />
                </button>
                <div className="flex items-center justify-center mb-2 mt-2">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border shadow overflow-hidden">
                    <Image
                      src={rm.icon}
                      alt="Roadmap Preview"
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-full bg-background"
                      unoptimized={shouldBypassNextImageOptimization(rm.icon)}
                    />
                  </div>
                </div>
                <div
                  className="text-base font-semibold text-foreground mb-1 text-center px-2 truncate w-full"
                  title={rm.title}
                >
                  {rm.title}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Last refined on {rm.date}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  ID: {getDisplayRoadmapId(rm.id)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Onboarding Popover/Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-popover border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center animate-fade-in">
            <div className="text-xl font-bold mb-2 text-primary text-center">{onboardingSteps[onboardingStep].title}</div>
            <div className="text-base text-muted-foreground mb-6 text-center">{onboardingSteps[onboardingStep].desc}</div>
            <div className="flex gap-3 w-full justify-center">
              <button
                className="px-4 py-2 rounded-lg bg-muted text-foreground font-medium border border-border hover:bg-muted/80 transition"
                onClick={handleSkipOnboarding}
              >
                Skip
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold border border-primary hover:bg-primary/90 transition"
                onClick={handleNextOnboarding}
              >
                {onboardingStep === onboardingSteps.length - 1 ? "Got it!" : "Next"}
              </button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">Step {onboardingStep + 1} of {onboardingSteps.length}</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
