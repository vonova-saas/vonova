import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Lock, Play } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface iAppProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description: string | null;
  };
  slug: string;
  studentId: string;
  isActive?: boolean;
  completed: boolean;
  locked?: boolean;
}

export function LessonItem({
  lesson,
  slug,
  studentId,
  isActive,
  completed,
  locked = false,
}: iAppProps) {
  const row = (
    <span
      className={buttonVariants({
        variant: completed ? "secondary" : "outline",
        className: cn(
          "w-full p-2.5 h-auto justify-start transition-all",
          locked && "cursor-not-allowed opacity-60",
          completed &&
            "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200",
          isActive &&
            !completed &&
            !locked &&
            "bg-primary/10 dark:bg-primary/20 border-primary/50 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary",
        ),
      })}
    >
      <div className="flex items-center gap-2.5 w-full min-w-0">
        <div className="shrink-0">
          {completed ? (
            <div className="size-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
              <Check className="size-3 text-white" />
            </div>
          ) : locked ? (
            <div className="size-5 rounded-full border-2 border-muted-foreground/40 bg-muted flex items-center justify-center">
              <Lock className="size-2.5 text-muted-foreground" />
            </div>
          ) : (
            <div
              className={cn(
                "size-5 rounded-full border-2 bg-background flex justify-center items-center",
                isActive
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-muted-foreground/60",
              )}
            >
              <Play
                className={cn(
                  "size-2.5 fill-current",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p
            className={cn(
              "text-xs font-medium truncate",
              completed
                ? "text-green-800 dark:text-green-200"
                : isActive
                  ? "text-primary font-semibold"
                  : "text-foreground",
            )}
          >
            {lesson.position}. {lesson.title}
          </p>
          {completed ? (
            <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              Completed
            </p>
          ) : null}
          {locked ? (
            <p className="text-[10px] text-muted-foreground font-medium">
              Locked
            </p>
          ) : null}
          {isActive && !completed && !locked ? (
            <p className="text-[10px] text-primary font-medium">
              Currently Watching
            </p>
          ) : null}
        </div>
      </div>
    </span>
  );

  if (locked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block w-full">{row}</span>
          </TooltipTrigger>
          <TooltipContent>Complete previous lesson first</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={`/student/${studentId}/courses/${slug}/${lesson.id}`}>
      {row}
    </Link>
  );
}
