"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_WORDS_PER_CHAPTER } from "@readbuddy/shared-types";

interface ChapterFormProps {
  onSubmit: (title: string, content: string) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  onCancel?: () => void;
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  disabled?: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function ChapterForm({
  onSubmit,
  onCancel,
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  disabled = false,
}: ChapterFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setError(null);
  }, [initialTitle, initialContent]);

  const wordCount = countWords(content);
  const isOverLimit = wordCount > MAX_WORDS_PER_CHAPTER;
  const canSubmit = !disabled && title.trim() !== "" && content.trim() !== "" && !isOverLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const result = await onSubmit(title.trim(), content);
    if (!result.ok) {
      setError(result.error ?? "Failed to save chapter");
      return;
    }
    if (!isEditing) {
      setTitle("");
      setContent("");
    }
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Chapter" : "Add New Chapter"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Chapter Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1: The Island"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Chapter Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the chapter text here..."
              disabled={disabled}
              className="min-h-[140px] resize-y text-base sm:min-h-[200px] sm:text-sm"
            />
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span
                className={
                  isOverLimit
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                }
              >
                {wordCount.toLocaleString()} / {MAX_WORDS_PER_CHAPTER.toLocaleString()} words
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={!canSubmit}>
              {isEditing ? "Save Changes" : "Add Chapter"}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
