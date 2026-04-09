"use client";

import { useEffect, useRef, useState } from "react";
import type { Chapter } from "@readbuddy/shared-types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const apiRef = useRef<CarouselApi | null>(null);
  const activeIndex = chapters.findIndex((ch) => ch.id === activeChapterId);

  // Scroll to active chapter when it changes
  useEffect(() => {
    if (apiRef.current && activeIndex >= 0) {
      apiRef.current.scrollTo(activeIndex, true);
    }
  }, [activeIndex]);

  // Sync carousel scroll → chapter switch
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const handleSelect = () => {
      const idx = api.selectedScrollSnap();
      const ch = chapters[idx];
      if (ch && ch.id !== activeChapterId) {
        onSelect(ch.id);
      }
    };
    api.on("select", handleSelect);
    return () => { api.off("select", handleSelect); };
  }, [chapters, activeChapterId, onSelect]);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < chapters.length - 1;
  const [pulsing, setPulsing] = useState<"prev" | "next" | null>(null);

  function pulse(dir: "prev" | "next") {
    setPulsing(dir);
    setTimeout(() => setPulsing(null), 300);
  }

  if (chapters.length <= 1) return null;

  return (
    <div className="relative flex items-center gap-1">
      {/* Prev arrow */}
      <button
        onClick={() => {
          if (canGoPrev) { pulse("prev"); onSelect(chapters[activeIndex - 1].id); }
        }}
        disabled={!canGoPrev}
        className="shrink-0 p-1 disabled:opacity-30"
        aria-label="Previous chapter"
      >
        <ChevronLeft
          className={`h-4 w-4 transition-all duration-300 ${
            pulsing === "prev"
              ? "scale-125 text-orange-600"
              : "text-muted-foreground"
          }`}
        />
      </button>

      {/* Carousel */}
      <Carousel
        className="min-w-0 flex-1"
        opts={{ align: "center", loop: false }}
        setApi={(api) => {
          apiRef.current = api;
          if (api && activeIndex >= 0) {
            api.scrollTo(activeIndex, true);
          }
        }}
      >
        <CarouselContent className="-ml-2">
          {chapters.map((ch) => {
            const isActive = ch.id === activeChapterId;
            return (
              <CarouselItem
                key={ch.id}
                className="pl-2 basis-auto"
                onClick={() => onSelect(ch.id)}
              >
                <div
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {ch.chapter_num}. {ch.title}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* Next arrow */}
      <button
        onClick={() => {
          if (canGoNext) { pulse("next"); onSelect(chapters[activeIndex + 1].id); }
        }}
        disabled={!canGoNext}
        className="shrink-0 p-1 disabled:opacity-30"
        aria-label="Next chapter"
      >
        <ChevronRight
          className={`h-4 w-4 transition-all duration-300 ${
            pulsing === "next"
              ? "scale-125 text-orange-600"
              : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}
