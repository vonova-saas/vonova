import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BookControlsProps {
  fontSize: string;
  decreaseFont: () => void;
  resetFont: () => void;
  increaseFont: () => void;
  lineHeight: string;
  setLineHeight: (lh: string) => void;
  handleCopySelection: () => void;
  handleCopyLink: () => void;
  showHighlightBtn: boolean;
  selectionText: string;
  handleHighlight: () => void;
  search: string;
  setSearch: (s: string) => void;
  matchCount: number;
}

export const BookControls: FC<BookControlsProps> = ({
  fontSize,
  decreaseFont,
  resetFont,
  increaseFont,
  lineHeight,
  setLineHeight,
  handleCopySelection,
  handleCopyLink,
  showHighlightBtn,
  selectionText,
  handleHighlight,
  search,
  setSearch,
  matchCount,
}) => (
  <div
    className="flex flex-wrap items-center gap-4 px-4 pt-4 pb-2"
    role="toolbar"
    aria-label="Book controls"
  >
    {/* Font Size Controls */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Font size:</span>
      <Button
        size="icon"
        variant="outline"
        aria-label="Decrease font size"
        onClick={decreaseFont}
        disabled={fontSize === "text-base"}
        tabIndex={0}
      >
        A-
      </Button>
      <Button
        size="icon"
        variant="outline"
        aria-label="Reset font size"
        onClick={resetFont}
        tabIndex={0}
      >
        A
      </Button>
      <Button
        size="icon"
        variant="outline"
        aria-label="Increase font size"
        onClick={increaseFont}
        disabled={fontSize === "text-2xl"}
        tabIndex={0}
      >
        A+
      </Button>
    </div>
    {/* Line Height Control */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Line height:</span>
      <Button
        size="sm"
        variant={lineHeight === "normal" ? "default" : "outline"}
        aria-label="Normal line height"
        onClick={() => setLineHeight("normal")}
        tabIndex={0}
      >
        Normal
      </Button>
      <Button
        size="sm"
        variant={lineHeight === "relaxed" ? "default" : "outline"}
        aria-label="Relaxed line height"
        onClick={() => setLineHeight("relaxed")}
        tabIndex={0}
      >
        Relaxed
      </Button>
    </div>
    {/* Copy/Share/Highlight Controls */}
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopySelection}
        aria-label="Copy selected text"
        tabIndex={0}
      >
        Copy Selection
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopyLink}
        aria-label="Copy chapter link"
        tabIndex={0}
      >
        Copy Link
      </Button>
      {showHighlightBtn && selectionText && (
        <Button
          size="sm"
          variant="default"
          onClick={handleHighlight}
          aria-label="Highlight selection"
          tabIndex={0}
        >
          Highlight
        </Button>
      )}
    </div>
    {/* Search in Chapter */}
    <div className="flex-1 min-w-0 flex items-center gap-2 md:ml-4 mt-2 md:mt-0">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search in chapter..."
        className="w-full"
        aria-label="Search in chapter"
        tabIndex={0}
      />
      {search && (
        <span
          className="text-xs text-muted-foreground whitespace-nowrap"
          aria-live="polite"
        >
          {matchCount} match{matchCount !== 1 ? "es" : ""}
        </span>
      )}
    </div>
  </div>
);
