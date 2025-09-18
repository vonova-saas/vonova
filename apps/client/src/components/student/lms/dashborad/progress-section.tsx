import React from "react";

const mockProgress = [
  {
    label: "Course Progress",
    percent: 68,
    color: "bg-primary",
  },
  {
    label: "Quiz Success Rate",
    percent: 82,
    color: "bg-green-500",
  },
  {
    label: "Books Read",
    percent: 40,
    color: "bg-blue-500",
  },
];

export default function ProgressSection() {
  return (
    <div className="bg-muted/50 rounded-xl p-6 mb-8 shadow-md border">
      <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
      <div className="space-y-4">
        {mockProgress.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-primary">
                {item.percent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${item.color}`}
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
