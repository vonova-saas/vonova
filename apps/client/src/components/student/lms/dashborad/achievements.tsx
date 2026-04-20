import React from "react";
import { Award, Flame } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const mockAchievements = [
  {
    label: "Quiz Master",
    description: "Completed 10 quizzes",
    icon: <Award className="w-6 h-6 text-yellow-500" />,
  },
  {
    label: "Bookworm",
    description: "Read 5 books",
    icon: <Award className="w-6 h-6 text-blue-500" />,
  },
  {
    label: "Streak Champion",
    description: "7-day learning streak",
    icon: <Flame className="w-6 h-6 text-red-500" />,
  },
];

// Full year data: 12 months, ~52 weeks, 7 days per week
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate a full year of data (365 days)
const generateYearData = () => {
  const data = [];
  for (let i = 0; i < 365; i++) {
    // Create some realistic patterns - more activity during weekdays, less on weekends
    const dayOfWeek = new Date(2024, 0, 1 + i).getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Higher chance of activity on weekdays, lower on weekends
    const baseChance = isWeekend ? 0.3 : 0.7;
    const random = Math.random();

    if (random < baseChance * 0.4)
      data.push(0);
    else if (random < baseChance * 0.7)
      data.push(1);
    else if (random < baseChance * 0.9)
      data.push(2);
    else if (random < baseChance * 0.98)
      data.push(3);
    else data.push(4);
  }
  return data;
};

const activityData = generateYearData();

// Color scale (GitHub style, 0 = empty, 4 = most)
const colorScale = [
  "bg-zinc-800 border-zinc-700",
  "bg-green-900 border-green-800",
  "bg-green-700 border-green-600",
  "bg-green-500 border-green-500",
  "bg-green-400 border-green-400",
];

// Calculate total achievements
const totalAchievements = activityData.reduce((sum, v) => sum + v, 0);

// Get the start date of the year (first Sunday)
const getStartDate = () => {
  const startOfYear = new Date(2024, 0, 1);
  const dayOfWeek = startOfYear.getDay();
  const daysToSubtract = dayOfWeek;
  startOfYear.setDate(startOfYear.getDate() - daysToSubtract);
  return startOfYear;
};

// Generate weeks data
const generateWeeks = () => {
  const weeks = [];
  const startDate = getStartDate();

  for (let week = 0; week < 53; week++) {
    // 53 weeks to cover the full year
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);

      // Check if this date is within the year 2024
      const isInYear = currentDate.getFullYear() === 2024;
      const dayIndex = Math.floor(
        (currentDate.getTime() - new Date(2024, 0, 1).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (isInYear && dayIndex >= 0 && dayIndex < 365) {
        weekData.push(activityData[dayIndex]);
      } else {
        weekData.push(-1);
      }
    }
    weeks.push(weekData);
  }

  return weeks;
};

const weeksData = generateWeeks();

export default function Achievements() {
  return (
    <Card className="border border-border/60 bg-card/70 backdrop-blur-sm shadow-lg rounded-2xl">
      <CardTitle className="text-xl font-semibold mb-4 px-6 pt-6">
        Achievements & Streaks
      </CardTitle>
      <CardContent className="space-y-6">
        {/* Achievement Badges */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-primary">
            Recent Achievements
          </h3>
          <div className="flex flex-wrap gap-4">
            {mockAchievements.map((ach, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 shadow border border-border/50 bg-muted/40"
              >
                {ach.icon}
                <div>
                  <div className="font-semibold text-primary text-sm">
                    {ach.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ach.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contribution Graph */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-primary">
            Activity Heatmap
          </h3>
          {/* Summary */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <div className="text-sm text-muted-foreground">
              {totalAchievements} achievements in the last year
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              {colorScale.map((cls, i) => (
                <span
                  key={i}
                  className={`inline-block w-3 h-3 rounded-sm border ${cls}`}
                ></span>
              ))}
              <span>More</span>
            </div>
          </div>
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-max">
              {/* Month labels */}
              <div className="flex gap-1 mb-2 ml-8">
                {MONTHS.map((month, monthIndex) => {
                  return (
                    <div
                      key={month}
                      className="text-xs text-muted-foreground"
                      style={{
                        marginLeft:
                          monthIndex === 0 ? "0" : `${50}px`,
                        minWidth: "20px",
                      }}
                    >
                      {month}
                    </div>
                  );
                })}
              </div>

              {/* Main grid */}
              <div className="flex gap-1 rounded-xl border border-border/50 bg-background/40 p-3">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="h-3 flex items-center">
                      <span className="text-xs text-muted-foreground select-none">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                {weeksData.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((value, dayIdx) => (
                      <span
                        key={dayIdx}
                        className={`block w-3 h-3 rounded-sm border transition-colors duration-200 cursor-pointer ${
                          value === -1
                            ? "bg-transparent border-transparent"
                            : colorScale[value]
                        }`}
                        title={
                          value === -1
                            ? "Outside the year"
                            : `${value} achievement${value !== 1 ? "s" : ""} on this day`
                        }
                      ></span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Caption */}
          <div className="mt-2 text-xs text-muted-foreground">
            Each square represents a day; color intensity shows achievement
            count.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
