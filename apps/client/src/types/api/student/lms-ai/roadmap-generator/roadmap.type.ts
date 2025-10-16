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

// createdBy: string;
// createdAt: string;
// updatedAt: string;