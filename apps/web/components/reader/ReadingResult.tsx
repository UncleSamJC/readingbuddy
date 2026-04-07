"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WordMatch } from "@/lib/text-diff";
import { readProgress } from "@/lib/text-diff";

interface ReadingResultProps {
  matches: WordMatch[];
  onDismiss: () => void;
  onRetry: () => void;
}

export function ReadingResult({ matches, onDismiss, onRetry }: ReadingResultProps) {
  const { total, correct, incorrect } = readProgress(matches);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const errorWords = matches.filter((m) => m.status === "incorrect");

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Reading Result</h3>
          <span className="text-2xl font-bold text-primary">{accuracy}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${accuracy}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {correct} correct, {incorrect} needs practice, out of {total} words
        </p>

        {errorWords.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">Words to practice:</p>
            <div className="flex flex-wrap gap-1.5">
              {errorWords.map((m, i) => (
                <span
                  key={i}
                  className="rounded-md bg-red-50 px-2 py-0.5 text-sm font-medium text-red-600"
                >
                  {m.word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onRetry}>
            Try Again
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
