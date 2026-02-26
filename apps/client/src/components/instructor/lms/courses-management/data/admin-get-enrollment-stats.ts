import { requireAdmin } from "./require-admin";

export async function adminGetEnrollmentStats() {
  await requireAdmin();

  // Demo-only: fake enrollment counts for the last 30 days, no DB
  const last30Days: { date: string; enrollments: number }[] = [
    { date: "2025-11-01", enrollments: 4 },
    { date: "2025-11-02", enrollments: 7 },
    { date: "2025-11-03", enrollments: 3 },
    { date: "2025-11-04", enrollments: 9 },
    { date: "2025-11-05", enrollments: 5 },
    { date: "2025-11-06", enrollments: 8 },
    { date: "2025-11-07", enrollments: 6 },
    { date: "2025-11-08", enrollments: 2 },
    { date: "2025-11-09", enrollments: 1 },
    { date: "2025-11-10", enrollments: 3 },
    { date: "2025-11-11", enrollments: 4 },
    { date: "2025-11-12", enrollments: 6 },
    { date: "2025-11-13", enrollments: 5 },
    { date: "2025-11-14", enrollments: 7 },
    { date: "2025-11-15", enrollments: 8 },
    { date: "2025-11-16", enrollments: 9 },
    { date: "2025-11-17", enrollments: 1 },
    { date: "2025-11-18", enrollments: 2 },
    { date: "2025-11-19", enrollments: 3 },
    { date: "2025-11-20", enrollments: 4 },
    { date: "2025-11-21", enrollments: 5 },
    { date: "2025-11-22", enrollments: 6 },
    { date: "2025-11-23", enrollments: 7 },
    { date: "2025-11-24", enrollments: 8 },
    { date: "2025-11-25", enrollments: 9 },
    { date: "2025-11-26", enrollments: 1 },
    { date: "2025-11-27", enrollments: 2 },
    { date: "2025-11-28", enrollments: 3 },
    { date: "2025-11-29", enrollments: 4 },
    { date: "2025-11-30", enrollments: 5 },
  ];

  return last30Days;
}
