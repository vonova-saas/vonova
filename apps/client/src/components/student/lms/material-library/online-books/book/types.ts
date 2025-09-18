export type FontSize = 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl';
export type LineHeight = 'normal' | 'relaxed';

export interface Highlight {
  text: string;
  id: string;
}

export interface ReadingStats {
  [chapter: string]: {
    time: number;
    completed: boolean;
  };
}

export interface BookViewerState {
  fontSize: FontSize;
  lineHeight: LineHeight;
  search: string;
  matchCount: number;
  highlights: { [chapter: string]: Highlight[] };
  bookmarks: string[];
  readingStats: ReadingStats;
  totalTime: number;
  isBookmarked: boolean;
  showHighlightBtn: boolean;
  selectionText: string;
}

export interface BookTOCProps {
  chapters: { slug: string; title: string }[];
  bookmarks: string[];
  currentChapterSlug: string;
  handleChapterChange: (slug: string) => void;
} 