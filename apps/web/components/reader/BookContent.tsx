"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WordMatch } from "@/lib/text-diff";
import { DictionaryPopover } from "./DictionaryPopover";

export interface BookContentProps {
  paragraphs: string[];
  activeParagraphIndex: number;
  onParagraphClick: (index: number) => void;
  onSentenceClick?: (sentence: string, paragraphIndex: number) => void;
  wordMatches?: WordMatch[] | null;
  isMarkingMode?: boolean;
  markedWordsSet?: Set<string>;
  onWordMark?: (word: string, sentence: string) => void;
  ttsSentenceIndex?: number | null;
}

export interface BookContentHandle {
  /** Returns the paragraph + sentence index of the first visible sentence in the card */
  getFirstVisiblePosition: () => { paragraphIndex: number; sentenceIndex: number };
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
  activeSentenceRef,
  ttsSentenceIndex,
  isActiveParagraph,
}: {
  text: string;
  markedWordsSet: Set<string>;
  onWordClick: (word: string, sentence: string) => void;
  activeSentenceRef: React.RefObject<HTMLSpanElement | null>;
  ttsSentenceIndex?: number | null;
  isActiveParagraph: boolean;
}) {
  const [dictState, setDictState] = useState<{ word: string; anchorRect: DOMRect } | null>(null);
  const sentences = splitSentences(text);
  const showTts = isActiveParagraph && ttsSentenceIndex != null;

  return (
    <>
      <p className="rounded-lg px-3 py-2 text-base leading-loose sm:text-lg">
        {sentences.map((sentence, si) => {
          const isCurrentTts = showTts && si === ttsSentenceIndex;
          const words = sentence.split(/(\s+)/);
          return (
            <span
              key={si}
              ref={isCurrentTts ? activeSentenceRef : undefined}
              className={cn(
                "transition-colors",
                isCurrentTts && "underline decoration-primary decoration-2 underline-offset-4"
              )}
            >
              {words.map((token, wi) => {
                const clean = cleanWord(token);
                if (!clean) return <span key={wi}>{token}</span>;

                const isMarked = markedWordsSet.has(clean);
                return (
                  <span
                    key={wi}
                    onClick={(e) => {
                      e.stopPropagation();
                      const word = token.replace(/[^a-zA-Z'-]/g, "");
                      onWordClick(word, sentence.trim());
                      setDictState({
                        word,
                        anchorRect: (e.target as HTMLElement).getBoundingClientRect(),
                      });
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

      {dictState && (
        <DictionaryPopover
          word={dictState.word}
          anchorRect={dictState.anchorRect}
          onClose={() => setDictState(null)}
        />
      )}
    </>
  );
}

export const BookContent = forwardRef<BookContentHandle, BookContentProps>(
  function BookContent(
    {
      paragraphs,
      activeParagraphIndex,
      onParagraphClick,
      onSentenceClick,
      wordMatches,
      isMarkingMode = false,
      markedWordsSet,
      onWordMark,
      ttsSentenceIndex,
    },
    ref
  ) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeSentenceRef = useRef<HTMLSpanElement>(null);

    // paragraph index → <p> element
    const paragraphRefsMap = useRef<Map<number, HTMLParagraphElement>>(new Map());
    // `${paragraphIndex}-${sentenceIndex}` → <span> element
    const sentenceRefsMap = useRef<Map<string, HTMLSpanElement>>(new Map());

    useImperativeHandle(ref, () => ({
      getFirstVisiblePosition() {
        const container = scrollContainerRef.current;
        if (!container) return { paragraphIndex: 0, sentenceIndex: 0 };

        const containerRect = container.getBoundingClientRect();

        // Find first paragraph with any content visible at the top
        const sortedParaKeys = [...paragraphRefsMap.current.keys()].sort((a, b) => a - b);
        for (const pIdx of sortedParaKeys) {
          const pEl = paragraphRefsMap.current.get(pIdx)!;
          const pRect = pEl.getBoundingClientRect();
          // Paragraph overlaps the visible area
          if (pRect.bottom > containerRect.top && pRect.top < containerRect.bottom) {
            // Find first sentence in this paragraph that is at or below the visible top
            for (let sIdx = 0; sIdx < 200; sIdx++) {
              const sEl = sentenceRefsMap.current.get(`${pIdx}-${sIdx}`);
              if (!sEl) break;
              const sRect = sEl.getBoundingClientRect();
              if (sRect.bottom > containerRect.top) {
                return { paragraphIndex: pIdx, sentenceIndex: sIdx };
              }
            }
            return { paragraphIndex: pIdx, sentenceIndex: 0 };
          }
        }
        return { paragraphIndex: activeParagraphIndex, sentenceIndex: 0 };
      },
    }));

    function scrollToActiveSentence() {
      const container = scrollContainerRef.current;
      const el = activeSentenceRef.current;
      if (!container || !el) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elAbsoluteTop = elRect.top - containerRect.top + container.scrollTop;
      const targetScroll = elAbsoluteTop - container.clientHeight / 2 + elRect.height / 2;
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }

    useEffect(() => {
      if (ttsSentenceIndex == null) return;
      scrollToActiveSentence();
    }, [ttsSentenceIndex]);

    useEffect(() => {
      if (!isMarkingMode || ttsSentenceIndex == null) return;
      requestAnimationFrame(() => scrollToActiveSentence());
    }, [isMarkingMode]);

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
        <CardContent
          ref={scrollContainerRef}
          className="max-h-[280px] space-y-1 overflow-y-auto px-3 py-0 sm:max-h-[380px] sm:px-6"
        >
          {paragraphs.map((text, i) => {
            const isActive = i === activeParagraphIndex;

            // Reading mode — word-level diff highlights
            if (isActive && wordMatches) {
              return <ReadingParagraph key={i} matches={wordMatches} />;
            }

            // Marking mode — each word clickable, TTS sentence underlined
            if (isMarkingMode && markedWordsSet && onWordMark) {
              return (
                <MarkableParagraph
                  key={i}
                  text={text}
                  markedWordsSet={markedWordsSet}
                  onWordClick={onWordMark}
                  activeSentenceRef={activeSentenceRef}
                  ttsSentenceIndex={ttsSentenceIndex}
                  isActiveParagraph={isActive}
                />
              );
            }

            // Normal / TTS mode — sentence click + optional TTS highlight
            const sentences = splitSentences(text);
            const showTtsHighlight = isActive && ttsSentenceIndex != null;

            return (
              <p
                key={i}
                ref={(el) => {
                  if (el) paragraphRefsMap.current.set(i, el);
                  else paragraphRefsMap.current.delete(i);
                }}
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
                      ref={(el) => {
                        const key = `${i}-${j}`;
                        if (el) {
                          sentenceRefsMap.current.set(key, el);
                          if (isCurrentTts) (activeSentenceRef as { current: HTMLSpanElement | null }).current = el;
                        } else {
                          sentenceRefsMap.current.delete(key);
                        }
                      }}
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
);
