import { FC } from "react";

interface BookStatsProps {
  timeOnChapter: number;
  totalTime: number;
  completed: boolean;
  formatTime: (seconds: number) => string;
}

export const BookStats: FC<BookStatsProps> = ({ timeOnChapter, totalTime, completed, formatTime }) => (
  <div className="flex flex-row items-center gap-4 text-xs text-muted-foreground mr-2">
    <span>Time on chapter: <b>{formatTime(timeOnChapter)}</b></span>
    <span>Total reading: <b>{formatTime(totalTime)}</b></span>
    <span>Completed: <b>{completed ? 'Yes' : 'No'}</b></span>
  </div>
); 