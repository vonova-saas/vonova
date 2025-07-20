import { create } from "zustand";

type drawerDetails = {
  query: string;
  parent: string;
  child: string;
};

export type UModel = "cohere";

type RoadmapMeta = {
  id: string;
  title: string;
  date: string;
  icon: string;
};

interface UIState {
  drawerOpen: boolean;
  toggleDrawer: () => void;
  drawerDetails: drawerDetails | null;
  setDrawerDetails: ({ query, parent, child }: drawerDetails) => void;
  model: UModel;
  setModel: (model: UModel) => void;
  query: string;
  setQuery: (query: string) => void;
  mainQuery: string;
  setMainQuery: (query: string) => void;
  modelApiKey: string | null;
  setModelApiKey: (query: string | null) => void;
  recentRoadmaps: RoadmapMeta[];
  setRecentRoadmaps: (roadmaps: RoadmapMeta[]) => void;
  addRecentRoadmap: (roadmap: RoadmapMeta) => void;
  removeRecentRoadmap: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  drawerDetails: null,
  setDrawerDetails: (data) => set(() => ({ drawerDetails: data })),
  model: "cohere",
  setModel: (model) => set(() => ({ model })),
  query: "",
  setQuery: (query) => set(() => ({ query })),
  mainQuery: "",
  setMainQuery: (mainQuery) => set(() => ({ mainQuery })),
  modelApiKey: "",
  setModelApiKey: (modelApiKey) => set(() => ({ modelApiKey })),
  recentRoadmaps: [],
  setRecentRoadmaps: (roadmaps) => set({ recentRoadmaps: roadmaps }),
  addRecentRoadmap: (roadmap) =>
    set((state) => ({
      recentRoadmaps: [roadmap, ...state.recentRoadmaps.filter((r) => r.id !== roadmap.id)],
    })),
  removeRecentRoadmap: (id) =>
    set((state) => ({
      recentRoadmaps: state.recentRoadmaps.filter((r) => r.id !== id),
    })),
}));
