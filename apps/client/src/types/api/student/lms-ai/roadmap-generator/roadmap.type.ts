// ========== Roadmap Generator API Endpoints ==========
export type generateRoadmapType = {
  topic: string;
  level: string;
  noOfWeeks: string;
}

export type generateRoadmapTypeResponse = {
  message: string;
  data: {
    status: boolean;
    text: {
      query: string;
      chapters: {
        [key: string]: string[];
      };
    };
    tree: {
      name: string;
      children: {
        name: string;
        children: {
          name: string;
        }[];
      }[];
    }[];
    roadmapId: string;
    metadata: {
      generated: string;
      summary: string;
    }
  }
}

export type updateRoadmapProgressType = {
  week_number: number;
  milestone_week: number;
  progress_percentage: number;
  time_spent_minutes: number;
  notes: string;
}

export type getUserRoadmapsTypeResponse = {
  message: string;
  data: generateRoadmapTypeResponse[];
}

export type deleteRoadmapType = {
  message: string;
  success: boolean;
}

// createdBy: string;
// createdAt: string;
// updatedAt: string;