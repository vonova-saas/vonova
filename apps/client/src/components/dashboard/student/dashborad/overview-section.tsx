import React, { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  MessageCircle,
  Brain,
  Layers3,
  TrendingUp,
  TrendingDown,
  Play,
  Plus,
  Trophy,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const mockStats = [
  {
    title: "Courses Enrolled",
    value: 5,
    icon: GraduationCap,
    color: "text-orange-400 bg-orange-900/30",
    statColor: "text-orange-400",
    trend: "+12%",
    trendDirection: "up",
  },
  {
    title: "Quizzes Completed",
    value: 12,
    icon: Layers3,
    color: "text-green-400 bg-green-900/30",
    statColor: "text-green-400",
    trend: "+8%",
    trendDirection: "up",
  },
  {
    title: "Books Read",
    value: 8,
    icon: BookOpen,
    color: "text-blue-400 bg-blue-900/30",
    statColor: "text-blue-400",
    trend: "+15%",
    trendDirection: "up",
  },
  {
    title: "AI Tools Used",
    value: 23,
    icon: Brain,
    color: "text-purple-400 bg-purple-900/30",
    statColor: "text-purple-400",
    trend: "+25%",
    trendDirection: "up",
  },
  {
    title: "Community Posts",
    value: 4,
    icon: MessageCircle,
    color: "text-orange-300 bg-orange-900/30",
    statColor: "text-orange-300",
    trend: "-2%",
    trendDirection: "down",
  },
];

// Mock data for charts
const lineData = [
  { month: "Jan", hours: 12 },
  { month: "Feb", hours: 18 },
  { month: "Mar", hours: 24 },
  { month: "Apr", hours: 20 },
  { month: "May", hours: 28 },
  { month: "Jun", hours: 32 },
  { month: "Jul", hours: 30 },
];

const barData = [
  { topic: "Math", progress: 80 },
  { topic: "Science", progress: 65 },
  { topic: "CS", progress: 90 },
  { topic: "AI", progress: 50 },
  { topic: "English", progress: 70 },
];

const pieData = [
  { name: "Courses", value: 40, color: "#6366f1" },
  { name: "Quizzes", value: 25, color: "#22c55e" },
  { name: "Books", value: 20, color: "#3b82f6" },
  { name: "AI Tools", value: 10, color: "#a21caf" },
  { name: "Community", value: 5, color: "#f59e42" },
];

const achievements = [
  {
    id: 1,
    title: "Quiz Master",
    description: "Completed 10 quizzes",
    icon: Trophy,
    color: "text-yellow-500",
  },
  {
    id: 2,
    title: "7-Day Streak",
    description: "Learning streak",
    icon: Clock,
    color: "text-green-500",
  },
];

const quickActions = [
  { title: "Continue Learning", icon: Play, href: "/dashboard/courses" },
  { title: "Start New Quiz", icon: Plus, href: "/dashboard/quizzes" },
  { title: "Ask AI Assistant", icon: Brain, href: "/dashboard/ai-assistant" },
];

export default function OverviewSection() {
  const [isLoading] = useState(false);
  const [studentName] = useState("Ahmed"); // Mock student name

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Personalized Welcome Message */}
      <Card className="border-2 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">
                Welcome back, {studentName}! 👋
              </h2>
              <p className="text-muted-foreground">
                Here&apos;s your learning snapshot for this week. Keep up the
                great work!
              </p>
            </div>
            <div className="flex gap-2">
              {achievements.slice(0, 2).map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className={`${achievement.color} bg-primary/10 rounded-full p-3 flex items-center justify-center`}
                    title={achievement.description}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Stat Cards with Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="shadow-lg border-2 backdrop-blur-sm hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6 flex flex-col items-center">
                <div className="rounded-full p-4 mb-3 bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold mb-1 text-primary">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {stat.trendDirection === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trendDirection === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground text-center font-medium">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 border-2 backdrop-blur-sm"
              asChild
            >
              <a href={action.href}>
                <Icon className="w-6 h-6 text-primary" />
                <span className="font-medium">{action.title}</span>
              </a>
            </Button>
          );
        })}
      </div>

      {/* 4. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="col-span-2 border-2 backdrop-blur-sm shadow-lg">
          <div className="pb-4 px-6 pt-6">
            <div className="text-muted-foreground font-semibold text-lg">
              Learning Activity Over Time
            </div>
          </div>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#374151",
                    border: "1px solid #4b5563",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#d97757"
                  strokeWidth={3}
                  dot={{
                    r: 6,
                    fill: "#d97757",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="rounded-2xl shadow-lg backdrop-blur-sm border-2 flex flex-col p-0">
          <div className="pb-4 px-6 pt-6">
            <div className="text-muted-foreground font-semibold text-lg">
              Activity Distribution
            </div>
          </div>
          <CardContent className="flex flex-row items-center gap-8 p-0 w-full">
            <div className="w-1/2 flex justify-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    stroke="bg-primary/10 text-primary"
                    strokeWidth={8}
                    paddingAngle={2}
                    cornerRadius={5}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col justify-center gap-3">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="text-muted-foreground font-medium">
                    {entry.name}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Bar Chart */}
      <Card className="border-2 backdrop-blur-sm shadow-lg">
        <div className="pb-4 px-6 pt-6">
          <div className="text-primary font-semibold text-lg">
            Progress by Topic
          </div>
        </div>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="topic"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#374151",
                  border: "1px solid #4b5563",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
              />
              <Bar dataKey="progress" fill="#d97757" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Loading State with Skeletons (Hidden by default, can be toggled) */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          {/* Welcome Card Skeleton */}
          <Card className="border-2 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>

          {/* Stat Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="shadow-lg border-2 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-center">
                  <Skeleton className="h-16 w-16 rounded-full mb-3" />
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2 border-2 backdrop-blur-sm shadow-lg">
              <div className="pb-4 px-6 pt-6">
                <Skeleton className="h-6 w-48" />
              </div>
              <CardContent className="pt-0">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-lg backdrop-blur-sm border-2">
              <div className="pb-4 px-6 pt-6">
                <Skeleton className="h-6 w-32" />
              </div>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart Skeleton */}
          <Card className="border-2 backdrop-blur-sm shadow-lg">
            <div className="pb-4 px-6 pt-6">
              <Skeleton className="h-6 w-36" />
            </div>
            <CardContent className="pt-0">
              <Skeleton className="h-56 w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
