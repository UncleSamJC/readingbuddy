"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Mic, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_CHAPTER_LIMITS } from "@readbuddy/shared-types";

export default function HomePage() {
  const currentBook = useAppStore((s) => s.currentBook);
  const chapters = useAppStore((s) => s.chapters);
  const readingProgress = useAppStore((s) => s.readingProgress);
  const markedWords = useAppStore((s) => s.markedWords);
  const userPlan = useAppStore((s) => s.userPlan);
  const initBook = useAppStore((s) => s.initBook);
  const hasBook = chapters.length > 0;

  useEffect(() => {
    initBook();
  }, [initBook]);

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
  const chaptersStarted = chapters.filter((ch) => readingProgress[ch.id]).length;
  const maxChapters = PLAN_CHAPTER_LIMITS[userPlan];

  // ── No book: welcome / onboarding ──
  if (!hasBook) {
    return (
      <main className="flex flex-col items-center pt-16">
        <h1 className="mb-3 text-4xl font-bold text-primary">ReadingBuddy</h1>
        <p className="mb-10 max-w-sm text-center text-lg text-muted-foreground">
          Your AI reading tutor. Paste a book chapter and start learning with Roz!
        </p>
        <Link href="/books/setup">
          <Button size="lg" className="gap-2 px-8 text-lg">
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </main>
    );
  }

  // ── Has book: dashboard ──
  return (
    <div className="space-y-6">
      {/* Book header */}
      <div>
        <h1 className="text-2xl font-bold">{currentBook?.title ?? "My Book"}</h1>
        {currentBook?.author && (
          <p className="text-sm text-muted-foreground">by {currentBook.author}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {chapters.length} / {maxChapters} chapters &middot;{" "}
          {totalWords.toLocaleString()} words &middot;{" "}
          {chaptersStarted} / {chapters.length} started
        </p>
      </div>

      {/* Chapter list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chapters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {chapters.map((ch) => {
            const started = !!readingProgress[ch.id];
            const vocabCount = markedWords.filter(
              (w) => w.chapterTitle === ch.title
            ).length;

            return (
              <Link key={ch.id} href={`/read/${ch.id}`}>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      started ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ch.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={started ? "text-primary" : ""}>
                        {started ? "Started" : "Not started"}
                      </span>
                      {vocabCount > 0 && (
                        <>
                          <span>&middot;</span>
                          <span>{vocabCount} word{vocabCount > 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Link href={`/read/${chapters[0].id}`}>
          <Card className="h-full transition-shadow hover:shadow-md active:scale-95">
            <CardContent className="flex flex-col items-center gap-1.5 py-4 sm:gap-2 sm:py-5">
              <BookOpen className="h-7 w-7 text-primary sm:h-6 sm:w-6" />
              <span className="text-xs font-medium sm:text-sm">Read</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/practice">
          <Card className="h-full transition-shadow hover:shadow-md active:scale-95">
            <CardContent className="flex flex-col items-center gap-1.5 py-4 sm:gap-2 sm:py-5">
              <Mic className="h-7 w-7 text-primary sm:h-6 sm:w-6" />
              <span className="text-xs font-medium sm:text-sm">Practice</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="h-full transition-shadow hover:shadow-md active:scale-95">
            <CardContent className="flex flex-col items-center gap-1.5 py-4 sm:gap-2 sm:py-5">
              <Settings className="h-7 w-7 text-muted-foreground sm:h-6 sm:w-6" />
              <span className="text-xs font-medium sm:text-sm">Settings</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
