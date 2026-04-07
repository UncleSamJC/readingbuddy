"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function PracticePage() {
  const router = useRouter();
  const chapters = useAppStore((s) => s.chapters);
  const markedWords = useAppStore((s) => s.markedWords);
  const hasBook = chapters.length > 0;

  if (!hasBook) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <p className="text-lg text-muted-foreground">
          Add book chapters first to unlock practice modes!
        </p>
        <Button onClick={() => router.push("/books/setup")}>Go to Book Setup</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Practice</h1>

      <Link href="/practice/vocab">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Vocabulary</CardTitle>
            <CardDescription>
              Review marked words with flashcards, listen to sentences, read aloud, and fill-in-the-blank quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {markedWords.length > 0
                ? `${markedWords.length} word${markedWords.length > 1 ? "s" : ""} marked for practice`
                : "Mark words while reading to build your list"}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
