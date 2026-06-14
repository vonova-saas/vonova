export type SheetProblemSummary = {
  _id: string;
  title: string;
  difficulty: string;
  tags: string[];
  order: number;
  status: string;
};

type ProblemLike = {
  _id?: unknown;
  title?: string;
  difficulty?: string;
  categories?: string[];
};

export function toSheetProblemSummary(
  problem: ProblemLike,
  order: number,
  sheetStatus: string,
): SheetProblemSummary {
  return {
    _id: String(problem._id),
    title: problem.title ?? '',
    difficulty: problem.difficulty ?? 'medium',
    tags: problem.categories ?? [],
    order,
    status: sheetStatus,
  };
}

export const SHEET_PROBLEM_METADATA_PROJECTION = {
  _id: 1,
  title: 1,
  difficulty: 1,
  categories: 1,
  createdAt: 1,
} as const;
