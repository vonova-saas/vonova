/**
 * Canonical LMS course / library subject categories.
 * Keep in sync with `services/lms/src/course/course/schema/course.schema.ts` (category enum).
 */
export const LMS_COURSE_CATEGORIES = [
  "PROGRAMMING_BASICS",
  "WEB_DEVELOPMENT",
  "FRONTEND",
  "BACKEND",
  "FULLSTACK",
  "FLUTTER",
  "MOBILE",
  "AI",
  "DATA_SCIENCE",
  "CYBER_SECURITY",
  "DEVOPS",
  "UI_UX",
  "DATABASE",
  "PROBLEM_SOLVING",
  "OTHER",
] as const;

export type LmsCourseCategory = (typeof LMS_COURSE_CATEGORIES)[number];

const CANONICAL = new Set<string>(LMS_COURSE_CATEGORIES);

/**
 * Map stored values (e.g. "frontend", "DATA SCIENCE") to a canonical enum key, or undefined if unknown.
 */
export function normalizeLmsCourseCategory(
  input: string | undefined | null,
): LmsCourseCategory | undefined {
  if (input == null || String(input).trim() === "") return undefined;
  const key = String(input).trim().toUpperCase().replace(/\s+/g, "_");
  if (CANONICAL.has(key)) return key as LmsCourseCategory;
  return undefined;
}

/** Human-readable label for pills and dropdowns (matches instructor UI style). */
export function formatLmsCourseCategoryLabel(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(" ");
}
