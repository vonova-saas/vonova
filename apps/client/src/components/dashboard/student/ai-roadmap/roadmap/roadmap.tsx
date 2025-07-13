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

enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private"
}
import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import Image from "next/image";

export default function Roadmap({ roadmapId }: { roadmapId?: string }) {
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
          icon: '/opengraph-image.png',
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
      <div className="min-h-screen w-full h-full relative" style={{ background: "radial-gradient(circle, #f3f3f3 1px, transparent 1px), radial-gradient(circle, #f3f3f3 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundPosition: "0 0, 16px 16px", backgroundColor: "#fff" }}>
        {/* Save button top left, Back button top right */}
        <button
          className="fixed top-8 left-8 z-20 px-6 py-3 rounded-xl bg-black text-white font-semibold shadow hover:bg-gray-900 transition"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('save-roadmap', { detail: roadmapId }));
          }}
        >
          Save
        </button>
        <button
          className="fixed top-8 right-8 z-20 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
          onClick={() => router.back()}
        >
          Back
        </button>
        {/* Roadmap Visualization Full Page */}
        <div className="w-full h-screen flex items-center justify-center">
          {isPending || isRoadmapPending || isLocalLoading ? (
            <div className="flex justify-center items-center w-full h-full">
              <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
            </div>
          ) : roadmapContent && roadmapContent[0] ? (
            <div className="w-full h-full">
              <ExpandCollapse data={roadmapContent} isPending={isRoadmapPending || isPending || isLocalLoading} roadmapId={roadmapId} />
            </div>
          ) : (
            <Instructions />
          )}
        </div>
      </div>
    );
  }

  // Otherwise, show the main roadmap generation UI
  // Main layout
  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative" style={{ background: "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)", backgroundSize: "28px 28px", backgroundPosition: "0 0, 14px 14px", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-10 pb-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-2">Good Evening, Vonova</h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium">Ready to generate your learning path?</p>
      </div>
      {/* Generator Card */}
      <div className="flex justify-center w-full mb-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-gray-100">
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
          />
        </div>
      </div>
      {/* Recent Roadmaps Section */}
      <div className="w-full max-w-6xl mx-auto px-2 pb-10">
        <h2 className="text-2xl font-bold mb-6 ml-2 text-neutral-900">Recent Roadmaps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Create New Project Card */}
          <div
            className="relative flex-shrink-0 w-full h-56 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center border border-dashed border-gray-200 cursor-pointer hover:shadow-lg transition group overflow-hidden"
            onClick={() => {
              // Scroll to the generator controls
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="group relative mb-5 flex items-center justify-center overflow-hidden rounded-[12px] border border-[#2F3640] bg-[#2F3640] px-3 py-3 text-white transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                  className="z-10 h-5 w-5 group-hover:text-[#2F3640]"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M6.417 2.917a.583.583 0 0 1 1.166 0v3.5h3.5a.583.583 0 0 1 0 1.166h-3.5v3.5a.583.583 0 1 1-1.166 0v-3.5h-3.5a.583.583 0 1 1 0-1.166h3.5z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <div className="absolute rounded-full right-0 top-0 h-full w-full scale-0 bg-[#C4FF8C] transition-all duration-100 group-hover:scale-110"></div>
              </div>
              <div className="font-[Outfit] text-[16px] group-hover:hidden font-bold text-black">Create New Project</div>
              <div className="font-[Outfit] text-[16px] hidden group-hover:block font-bold text-black">Time to start</div>
            </div>
          </div>
          {/* Recent Roadmap Cards */}
          {recentRoadmaps.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">No recent roadmaps found.</div>
          ) : (
            recentRoadmaps.map((rm) => (
              <div
                key={rm.id}
                className="relative flex-shrink-0 w-full h-56 bg-white rounded-2xl shadow-md flex flex-col items-center justify-center hover:shadow-lg transition group overflow-hidden cursor-pointer"
                onClick={() => router.push(`/dashboard/ai-roadmap-generator/${rm.id}`)}
              >
                {/* Delete button, only visible on hover */}
                <button
                  className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-2 shadow transition"
                  onClick={(e) => { e.stopPropagation(); handleDeleteRoadmap(rm.id); }}
                  aria-label="Delete"
                >
                  <Trash size={20} />
                </button>
                <Image
                  src={rm.icon}
                  alt="Roadmap Preview"
                  width="200"
                  height="200"
                  className="w-20 h-20 object-contain rounded-xl mb-3"
                />
                <div className="text-lg font-semibold mb-1">{rm.title}</div>
                <div className="text-sm text-gray-400">Last refined on {rm.date}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
