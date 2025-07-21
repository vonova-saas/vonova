export type Author = {
  name: string;
  avatar: string;
};

export type Book = {
  id: string;
  title: string;
  authors: Author[];
  cover: string;
  description: string;
  topic: string;
  badge?: string;
  rating?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
};

export type SearchFilterProps = {
  search: string;
  setSearch: (value: string) => void;
  topic: string;
  setTopic: (value: string) => void;
  topics: string[];
};

export type BookQuickViewProps = {
  book: Book | null;
  onClose: () => void;
  open: boolean;
};

export type BookCardProps = {
  book: Book;
  onQuickView: (book: Book) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
};

export type OverviewCardProps = {
  totalBooks: number;
  uniqueTopics: number;
};

export type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  currentItems: number;
}; 