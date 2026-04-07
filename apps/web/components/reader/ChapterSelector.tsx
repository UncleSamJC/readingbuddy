"use client";

import type { Chapter } from "@readbuddy/shared-types";
import { cn } from "@/lib/utils";

interface ChapterSelectorProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (chapterId: string) => void;
}

export function ChapterSelector({
  chapters,
  activeChapterId,
  onSelect,
}: ChapterSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {chapters.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onSelect(ch.id)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            ch.id === activeChapterId
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Ch. {ch.chapter_num}
        </button>
      ))}
    </div>
  );
}
