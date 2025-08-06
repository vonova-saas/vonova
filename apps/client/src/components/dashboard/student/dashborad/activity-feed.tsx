import React from "react";
import { BookOpen, Layers3, Brain, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockActivities = [
  {
    type: "quiz",
    icon: <Layers3 className="w-5 h-5 text-green-600" />,
    description: "Completed Quiz: Algebra Basics",
    time: "2 hours ago",
  },
  {
    type: "book",
    icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    description: "Read Chapter 3 of 'Learning React'",
    time: "5 hours ago",
  },
  {
    type: "ai",
    icon: <Brain className="w-5 h-5 text-purple-600" />,
    description: "Used AI Assistant for math problem",
    time: "Today",
  },
  {
    type: "community",
    icon: <MessageCircle className="w-5 h-5 text-orange-600" />,
    description: "Posted in Community: 'Best study tips?'",
    time: "Yesterday",
  },
];

export default function ActivityFeed() {
  return (
    <Card className="border-2 backdrop-blur-sm shadow-lg">
    <CardHeader>
      <CardTitle className="text-lg">Recent Activity</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {mockActivities.map((activity) => {
          return (
            <div key={activity.type} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {activity.icon}
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
  );
}
