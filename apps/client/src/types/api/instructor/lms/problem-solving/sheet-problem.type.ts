import type { InstructorProblemEntity } from "@/types/api/instructor/lms/problem-solving/problem-solving.type";

/** Lightweight problem row embedded in sheet GET responses. */
export type SheetProblemSummary = {
  _id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  order: number;
  status: string;
};

export function fullProblemToSummary(
  problem: Pick<
    InstructorProblemEntity,
    "_id" | "title" | "difficulty" | "categories"
  >,
  order: number,
  sheetStatus: string,
): SheetProblemSummary {
  return {
    _id: problem._id,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.categories ?? [],
    order,
    status: sheetStatus,
  };
}

export function isSheetProblemSummary(
  value: SheetProblemSummary | InstructorProblemEntity,
): value is SheetProblemSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    "order" in value &&
    !("testCases" in value)
  );
}
