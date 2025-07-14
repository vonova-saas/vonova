/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import ExpandCollapse from "../flow-components/expand-collapse";
import { useGenerateRoadmap } from "@/lib/queries";
import { createTree } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { GeneratorControls } from "../flow-components/generator-controls";
import { useUIStore } from "@/lib/stores/useUI";
import Instructions from "../flow-components/Instructions";
import { Sparkles } from "lucide-react";
import { Clock, PlusCircle, FolderOpen, Trash, FileDown, Image as ImageIcon, Share2 } from "lucide-react";
import React from "react";

enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private"
}
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { downloadImage } from "@/lib/utils";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function Roadmap({ roadmapId }: { roadmapId?: string }) {
  // Stepper state for progress indicator (must be before any conditional return)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { query } = useUIStore();
  const [localRoadmap, setLocalRoadmap] = useState<{ content?: any; visibility?: string } | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const router = useRouter();
  // Recent roadmaps state (dynamic from localStorage)
  const [recentRoadmaps, setRecentRoadmaps] = useState<Array<{ id: string; title: string; date: string; icon: string }>>([]);

  // Helper to load recent roadmaps from localStorage
  const loadRecentRoadmaps = () => {
    if (typeof window === 'undefined') return [];
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('generated-'));
    const roadmaps = keys.map((id) => {
      try {
        const data = JSON.parse(localStorage.getItem(id) || '{}');
        return {
          id,
          title: data?.content?.[0]?.name || 'Untitled',
          date: new Date(parseInt(id.replace('generated-', ''), 10)).toLocaleDateString(),
          icon: '/images/placeholder.svg',
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{ id: string; title: string; date: string; icon: string }>;
    // Sort by most recent
    return roadmaps.sort((a, b) => parseInt(b.id.replace('generated-', '')) - parseInt(a.id.replace('generated-', '')));
  };

  // Load recent roadmaps on mount
  useEffect(() => {
    setRecentRoadmaps(loadRecentRoadmaps());
  }, []);

  // Delete roadmap handler
  const handleDeleteRoadmap = (id: string) => {
    setRecentRoadmaps((prev) => prev.filter((rm) => rm.id !== id));
    if (typeof window !== "undefined") {
      localStorage.removeItem(id);
    }
  };

  // 1. Try to load from localStorage if roadmapId is present
  useEffect(() => {
    if (roadmapId) {
      setIsLocalLoading(true);
      const roadmapData = typeof window !== "undefined" ? localStorage.getItem(roadmapId) : null;
      if (roadmapData) {
        setLocalRoadmap(JSON.parse(roadmapData));
      } else {
        setLocalRoadmap(null);
      }
      setIsLocalLoading(false);
    }
  }, [roadmapId]);

  // 2. Fallback: fetch from backend if not found in localStorage
  const { data: roadmap, isPending: isRoadmapPending } = useQuery<{ content?: any; visibility?: string } | null>({
    queryFn: async () => {
      if (!roadmapId) return null;
      // ...fetch from backend if needed...
      return null;
    },
    queryKey: ["Roadmap", roadmapId],
    enabled: Boolean(roadmapId && !localRoadmap),
  });

  // 3. Handle roadmap generation
  const { data, mutate, isPending } = useGenerateRoadmap();

  // 4. Compose the data array for ExpandCollapse
  let generatedTree: any = undefined;
  if (data) {
    if (data.query && data.chapters) {
      generatedTree = createTree(data)[0];
    } else if (data.text && data.text.query && data.text.chapters) {
      generatedTree = createTree(data.text)[0];
    } else if (data.tree && Array.isArray(data.tree)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      generatedTree = data.tree[0];
    }
  }

  // 5. Decide what to render
  const roadmapContent =
    (data?.text && createTree(data.text)) ||
    (localRoadmap && localRoadmap.content ? localRoadmap.content : undefined) ||
    (roadmap && roadmap.content ? roadmap.content : undefined);

  // If viewing a specific roadmap (roadmapId is present), show the roadmap with Save/Back buttons
  if (roadmapId) {
    return (
      <div className="min-h-screen w-full h-full relative flex flex-col items-center justify-center bg-background" style={{
        background: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.15) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px"
      }}>
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
            {isPending || isRoadmapPending || isLocalLoading ? (
              <div className="flex justify-center items-center w-full h-64">
                <Loader2 className="animate-spin w-10 h-10 text-primary/60" />
              </div>
            ) : roadmapContent && roadmapContent[0] ? (
              <div className="w-full">
                <ExpandCollapse data={roadmapContent} isPending={isRoadmapPending || isPending || isLocalLoading} roadmapId={roadmapId} />
              </div>
            ) : (
              <Instructions />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main layout
  return (
    <div className="h-full w-full min-h-screen flex flex-col items-center justify-center overflow-hidden relative bg-background" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
      {/* Header */}
      <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto pt-8 pb-4">
        <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary mb-3" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1 text-center">AI Roadmap Generator</h1>
        <p className="text-base md:text-lg text-muted-foreground font-normal text-center mb-2">What would you like to learn today? Enter your topic and preferences below to generate a personalized learning roadmap.</p>
        <div className="w-16 h-1 rounded-full bg-primary/20 mx-auto mb-2" />
      </div>
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
            roadmapId={data?.roadmapId}
            dbRoadmapId={roadmapId || ""}
            visibility={
              (typeof roadmap?.visibility === 'string' && (roadmap.visibility === Visibility.PUBLIC || roadmap.visibility === Visibility.PRIVATE))
                ? (roadmap.visibility as Visibility)
                : ((localRoadmap && (localRoadmap.visibility === Visibility.PUBLIC || localRoadmap.visibility === Visibility.PRIVATE))
                  ? (localRoadmap.visibility as Visibility)
                  : Visibility.PUBLIC)
            }
            title={query}
            key={
              (typeof roadmap?.visibility === 'string' && (roadmap.visibility === Visibility.PUBLIC || roadmap.visibility === Visibility.PRIVATE))
                ? (roadmap.visibility as Visibility)
                : ((localRoadmap && (localRoadmap.visibility === Visibility.PUBLIC || localRoadmap.visibility === Visibility.PRIVATE))
                  ? (localRoadmap.visibility as Visibility)
                  : Visibility.PUBLIC)
            }
            step={step}
            setStep={setStep}
          />
        </div>
      </div>
      {/* Recent Roadmaps Section */}
      <div className="w-full max-w-6xl mx-auto px-2 pb-10 mt-10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Recent Roadmaps</h2>
        </div>
        <div className="w-16 h-1 rounded-full bg-primary/20 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Create New Project Card */}
          <div
            className="relative flex flex-col items-center justify-center h-48 bg-card rounded-2xl shadow-lg border-2 border-dashed border-primary/30 cursor-pointer hover:shadow-xl hover:scale-[1.03] transition group overflow-hidden"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="flex items-center justify-center mb-3">
                <PlusCircle className="w-10 h-10 text-primary bg-primary/10 rounded-full p-2 shadow" />
              </div>
              <div className="font-medium text-base text-foreground">Create New Project</div>
              <div className="text-xs text-muted-foreground mt-1">Start a new learning journey</div>
            </div>
          </div>
          {/* Recent Roadmap Cards */}
          {recentRoadmaps.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
              <div className="text-lg font-medium text-muted-foreground mb-1">No recent roadmaps found</div>
              <div className="text-sm text-muted-foreground">Your generated roadmaps will appear here.</div>
            </div>
          ) : (
            recentRoadmaps.map((rm) => (
              <div
                key={rm.id}
                className="relative flex flex-col items-center justify-center h-48 bg-card rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition group overflow-hidden cursor-pointer border border-border"
                onClick={() => router.push(`/dashboard/ai-roadmap-generator/${rm.id}`)}
              >
                {/* Delete button, only visible on hover */}
                <button
                  className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 bg-muted hover:bg-red-500 hover:text-white text-muted-foreground rounded-full p-2 shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={(e) => { e.stopPropagation(); handleDeleteRoadmap(rm.id); }}
                  aria-label="Delete roadmap"
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
                    />
                  </div>
                </div>
                <div className="text-base font-semibold text-foreground mb-1 text-center px-2 truncate w-full" title={rm.title}>{rm.title}</div>
                <div className="text-xs text-muted-foreground text-center">Last refined on {rm.date}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
