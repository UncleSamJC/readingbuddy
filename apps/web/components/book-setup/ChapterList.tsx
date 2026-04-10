"use client";

import type { Chapter } from "@readbuddy/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChapterListProps {
  chapters: Chapter[];
  maxChapters: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChapterList({ chapters, maxChapters, onEdit, onDelete }: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
        No chapters yet. Add your first chapter below.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {chapters.length} / {maxChapters} chapters
      </p>
      {chapters.map((ch) => (
        <Card key={ch.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{ch.title}</p>
              <p className="text-sm text-muted-foreground">
                {ch.word_count.toLocaleString()} words
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(ch.id)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(ch.id)}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
