export class LocalStorage {
  static get<T = string>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(key);
    try {
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return value as T;
    }
  }

  static set<T = string>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}

// RoadmapMeta type for recent roadmaps
export type RoadmapMeta = {
  id: string;
  title: string;
  date: string;
  icon: string;
};

export function getRecentRoadmaps(): RoadmapMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('recent-roadmaps') || '[]');
  } catch {
    return [];
  }
}

export function saveRecentRoadmaps(roadmaps: RoadmapMeta[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('recent-roadmaps', JSON.stringify(roadmaps));
}

export function addRecentRoadmap(meta: RoadmapMeta) {
  const roadmaps = getRecentRoadmaps().filter(r => r.id !== meta.id);
  roadmaps.unshift(meta);
  saveRecentRoadmaps(roadmaps);
}

export function removeRecentRoadmap(id: string) {
  const roadmaps = getRecentRoadmaps().filter(r => r.id !== id);
  saveRecentRoadmaps(roadmaps);
} 