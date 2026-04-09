"use client";

import { useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WordMatch } from "@/lib/text-diff";

export interface BookContentProps {
  paragraphs: string[];
  activeParagraphIndex: number;
  onParagraphClick: (index: number) => void;
  onSentenceClick?: (sentence: string, paragraphIndex: number) => void;
  wordMatches?: WordMatch[] | null;
  isMarkingMode?: boolean;
  markedWordsSet?: Set<string>;
  onWordMark?: (word: string, sentence: string) => void;
  /** Index of the sentence currently being read by TTS (within active paragraph) */
  ttsSentenceIndex?: number | null;
}

export function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+[\s]*/g) ?? [text];
}

function cleanWord(word: string): string {
  return word.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
}

function ReadingParagraph({ matches }: { matches: WordMatch[] }) {
  return (
    <p className="rounded-lg bg-primary/10 px-3 py-2 text-base font-medium leading-loose sm:text-lg">
      {matches.map((m, i) => (
        <span
          key={i}
          className={cn(
            "transition-colors",
            m.status === "correct" && "text-green-700",
            m.status === "incorrect" && "rounded bg-red-100 px-0.5 text-red-600",
            m.status === "unread" && "text-foreground/40"
          )}
        >
          {m.word}{" "}
        </span>
      ))}
    </p>
  );
}

function MarkableParagraph({
  text,
  markedWordsSet,
  onWordClick,
}: {
  text: string;
  markedWordsSet: Set<string>;
  onWordClick: (word: string, sentence: string) => void;
}) {
  const sentences = splitSentences(text);

  return (
    <p className="rounded-lg px-3 py-2 text-base leading-loose sm:text-lg">
      {sentences.map((sentence, si) => {
        const words = sentence.split(/(\s+)/);
        return (
          <span key={si}>
            {words.map((token, wi) => {
              const clean = cleanWord(token);
              if (!clean) return <span key={wi}>{token}</span>;

              const isMarked = markedWordsSet.has(clean);
              return (
                <span
                  key={wi}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(token.replace(/[^a-zA-Z'-]/g, ""), sentence.trim());
                  }}
                  className={cn(
                    "cursor-pointer rounded px-0.5 transition-colors",
                    isMarked
                      ? "bg-amber-300/60 font-medium text-amber-900"
                      : "hover:bg-primary/10"
                  )}
                >
                  {token}
                </span>
              );
            })}
          </span>
        );
      })}
    </p>
  );
}

export function BookContent({
  paragraphs,
  activeParagraphIndex,
  onParagraphClick,
  onSentenceClick,
  wordMatches,
  isMarkingMode = false,
  markedWordsSet,
  onWordMark,
  ttsSentenceIndex,
}: BookContentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const el = activeSentenceRef.current;
    if (ttsSentenceIndex == null || !container || !el) return;

    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const containerHeight = container.clientHeight;
    // Scroll so the active sentence is roughly centered
    const targetScroll = elTop - containerHeight / 2 + elHeight / 2;
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
  }, [ttsSentenceIndex]);

  const handleSentenceClick = useCallback(
    (sentence: string, paraIndex: number) => {
      onSentenceClick?.(sentence.trim(), paraIndex);
    },
    [onSentenceClick]
  );

  if (paragraphs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No content to display. Go to My Book to add chapters.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent ref={scrollContainerRef} className="max-h-[280px] space-y-1 overflow-y-auto px-3 py-0 sm:max-h-[380px] sm:px-6">
        {paragraphs.map((text, i) => {
          const isActive = i === activeParagraphIndex;

          // Reading mode — word-level diff highlights
          if (isActive && wordMatches) {
            return <ReadingParagraph key={i} matches={wordMatches} />;
          }

          // Marking mode — each word clickable
          if (isMarkingMode && markedWordsSet && onWordMark) {
            return (
              <MarkableParagraph
                key={i}
                text={text}
                markedWordsSet={markedWordsSet}
                onWordClick={onWordMark}
              />
            );
          }

          // Normal / TTS mode — sentence click + optional TTS highlight
          const sentences = splitSentences(text);
          const showTtsHighlight = isActive && ttsSentenceIndex != null;

          return (
            <p
              key={i}
              onClick={() => onParagraphClick(i)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-base leading-relaxed transition-colors sm:text-lg",
                isActive && !showTtsHighlight && "bg-primary/10 font-medium",
                !isActive && "hover:bg-muted"
              )}
            >
              {sentences.map((sentence, j) => {
                const isCurrentTts = showTtsHighlight && j === ttsSentenceIndex;
                return (
                <span
                  key={j}
                  ref={isCurrentTts ? activeSentenceRef : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    onParagraphClick(i);
                    handleSentenceClick(sentence, i);
                  }}
                  className={cn(
                    "rounded-md transition-colors",
                    isCurrentTts
                      ? "bg-green-200/70 px-1 py-0.5"
                      : showTtsHighlight && j < ttsSentenceIndex!
                        ? "text-muted-foreground"
                        : "hover:underline hover:decoration-primary/40 hover:decoration-2 hover:underline-offset-4"
                  )}
                >
                  {sentence}
                </span>
                );
              })}
            </p>
          );
        })}
      </CardContent>
    </Card>
  );
}
