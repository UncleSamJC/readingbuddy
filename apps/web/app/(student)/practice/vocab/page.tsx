"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, type MarkedWord } from "@/lib/store";
import { useSpeech } from "@/lib/use-speech";
import { diffWords, readProgress, type WordMatch } from "@/lib/text-diff";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchTtsAudio } from "@/lib/api";
import {
  ArrowLeft, ArrowRight, RotateCcw, Eye, EyeOff, Check, X,
  Trash2, Volume2, Mic, Square, Pause, Play,
} from "lucide-react";

type Mode = "flashcard" | "quiz";
type TtsState = "idle" | "playing" | "paused";

function makeBlank(word: MarkedWord): { sentence: string; answer: string } {
  const regex = new RegExp(`\\b${word.word}\\b`, "i");
  const sentence = word.context.replace(regex, "_____");
  return { sentence, answer: word.word };
}

export default function VocabPracticePage() {
  const router = useRouter();
  const markedWords = useAppStore((s) => s.markedWords);
  const removeMarkedWord = useAppStore((s) => s.removeMarkedWord);
  const ttsVoice = useAppStore((s) => s.ttsVoice);
  const ttsSpeed = useAppStore((s) => s.ttsSpeed);

  const vocabList = useMemo(() => {
    const shuffled = [...markedWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [markedWords]);

  const [mode, setMode] = useState<Mode>("flashcard");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // TTS state
  const [ttsState, setTtsState] = useState<TtsState>("idle");

  // Read aloud state
  const [readResult, setReadResult] = useState<WordMatch[] | null>(null);

  const current = vocabList[currentIndex] as MarkedWord | undefined;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // Speech recognition for read aloud
  const stopRef = useRef<() => void>(() => {});

  const { isRecording, toggle: toggleRecording, stop: stopRecording } = useSpeech({
    onTranscript: useCallback(
      (transcript: string) => {
        if (!current) return;
        const matches = diffWords(current.context, transcript);
        setReadResult(matches);
        const allRead = matches.length > 0 && matches.every((m) => m.status !== "unread");
        if (allRead) {
          setTimeout(() => stopRef.current(), 300);
        }
      },
      [current]
    ),
    onEnd: useCallback(
      (fullTranscript: string) => {
        if (!current) return;
        setReadResult(diffWords(current.context, fullTranscript));
      },
      [current]
    ),
  });

  stopRef.current = stopRecording;

  function resetCard() {
    setShowContext(false);
    setQuizAnswer("");
    setQuizResult(null);
    setReadResult(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setTtsState("idle");
  }

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, vocabList.length - 1));
    resetCard();
  }, [vocabList.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    resetCard();
  }, []);

  const handleQuizSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!current || quizResult) return;
      const isCorrect =
        quizAnswer.trim().toLowerCase() === current.word.toLowerCase();
      setQuizResult(isCorrect ? "correct" : "wrong");
      setScore((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
      }));
    },
    [current, quizAnswer, quizResult]
  );

  const resetPractice = useCallback(() => {
    setCurrentIndex(0);
    resetCard();
    setScore({ correct: 0, total: 0 });
  }, []);

  // TTS handlers (real OpenAI API)
  const handleListen = useCallback(async () => {
    if (!current) return;
    setTtsState("playing");
    try {
      const url = await fetchTtsAudio(current.context, ttsVoice, ttsSpeed);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setTtsState("idle"); audioRef.current = null; };
      audio.onerror = () => { setTtsState("idle"); audioRef.current = null; };
      await audio.play();
    } catch {
      setTtsState("idle");
    }
  }, [current, ttsVoice, ttsSpeed]);

  const handleTtsPause = useCallback(() => { audioRef.current?.pause(); setTtsState("paused"); }, []);
  const handleTtsResume = useCallback(() => { audioRef.current?.play(); setTtsState("playing"); }, []);
  const handleTtsStop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setTtsState("idle");
  }, []);

  // Read aloud
  const handleReadAloud = useCallback(() => {
    setReadResult(null);
    toggleRecording();
  }, [toggleRecording]);

  // No words marked
  if (vocabList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <p className="text-lg text-muted-foreground">No words marked yet!</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Go to the reading page and tap the <strong>Mark Words</strong> button,
          then tap any word you want to practice.
        </p>
        <Button onClick={() => router.push("/")}>Go to Reading</Button>
      </div>
    );
  }

  const accuracy = readResult
    ? (() => { const r = readProgress(readResult); return r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0; })()
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/practice")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-1">
          <Button
            variant={mode === "flashcard" ? "default" : "secondary"}
            size="sm"
            onClick={() => { setMode("flashcard"); resetPractice(); }}
          >
            Flashcards
          </Button>
          <Button
            variant={mode === "quiz" ? "default" : "secondary"}
            size="sm"
            onClick={() => { setMode("quiz"); resetPractice(); }}
          >
            Fill in Blank
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{currentIndex + 1} / {vocabList.length}</span>
        {mode === "quiz" && <span>Score: {score.correct} / {score.total}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / vocabList.length) * 100}%` }}
        />
      </div>

      {/* ── Flashcard mode ── */}
      {current && mode === "flashcard" && (
        <Card className="relative">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {/* Word */}
            <p className="text-3xl font-bold text-primary">{current.word}</p>
            <p className="text-sm text-muted-foreground">from: {current.chapterTitle}</p>

            {/* Show / hide sentence */}
            {!showContext ? (
              <Button variant="ghost" size="sm" onClick={() => setShowContext(true)}>
                <Eye className="mr-1 h-4 w-4" /> Show sentence
              </Button>
            ) : (
              <>
                {/* Sentence with read result highlights */}
                <p className="max-w-md text-center text-base leading-relaxed">
                  {readResult
                    ? readResult.map((m, i) => (
                        <span
                          key={i}
                          className={cn(
                            m.status === "correct" && "text-green-700",
                            m.status === "incorrect" && "rounded bg-red-100 px-0.5 text-red-600",
                            m.status === "unread" && "text-foreground/40"
                          )}
                        >
                          {m.word}{" "}
                        </span>
                      ))
                    : <span className="text-foreground/80">&ldquo;{current.context}&rdquo;</span>
                  }
                </p>

                {/* Read aloud result */}
                {accuracy !== null && !isRecording && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{accuracy}%</p>
                    <p className="text-xs text-muted-foreground">accuracy</p>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Listening...
                  </div>
                )}

                {/* Listen & Read Aloud buttons */}
                <div className="flex gap-2">
                  {ttsState === "idle" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleListen}
                      disabled={isRecording}
                      className="gap-1.5"
                    >
                      <Volume2 className="h-4 w-4" /> Listen
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={ttsState === "playing" ? handleTtsPause : handleTtsResume}
                        className="gap-1.5"
                      >
                        {ttsState === "playing"
                          ? <><Pause className="h-4 w-4" /> Pause</>
                          : <><Play className="h-4 w-4" /> Resume</>
                        }
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleTtsStop}>
                        <Square className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}

                  {!isRecording ? (
                    <Button
                      variant={readResult ? "secondary" : "default"}
                      size="sm"
                      onClick={handleReadAloud}
                      disabled={ttsState !== "idle"}
                      className="gap-1.5"
                    >
                      <Mic className="h-4 w-4" />
                      {readResult ? "Try Again" : "Read Aloud"}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={toggleRecording}
                      className="gap-1.5 animate-pulse"
                    >
                      <Mic className="h-4 w-4" /> Stop
                    </Button>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={() => { setShowContext(false); setReadResult(null); }}>
                  <EyeOff className="mr-1 h-4 w-4" /> Hide
                </Button>
              </>
            )}

          </CardContent>
          {/* Remove — icon only, bottom-left corner */}
          <button
            className="absolute bottom-3 left-3 rounded-md p-1.5 text-destructive/60"
            title="Remove from list"
            onClick={() => {
              removeMarkedWord(current.word);
              if (currentIndex >= vocabList.length - 1 && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
              resetCard();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Card>
      )}

      {/* ── Quiz mode ── */}
      {current && mode === "quiz" && (() => {
        const { sentence, answer } = makeBlank(current);
        return (
          <Card>
            <CardContent className="space-y-4 py-8">
              <p className="text-center text-lg leading-relaxed">{sentence}</p>
              <form onSubmit={handleQuizSubmit} className="flex gap-2">
                <Input
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  placeholder="Type the missing word..."
                  disabled={quizResult !== null}
                  className="flex-1 text-center text-lg"
                  autoFocus
                />
                {!quizResult && (
                  <Button type="submit" disabled={!quizAnswer.trim()}>Check</Button>
                )}
              </form>
              {quizResult && (
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                    quizResult === "correct" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  )}
                >
                  {quizResult === "correct"
                    ? <><Check className="h-4 w-4" /> Correct!</>
                    : <><X className="h-4 w-4" /> The answer is: <strong>{answer}</strong></>
                  }
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Finished */}
      {currentIndex === vocabList.length - 1 && (
        quizResult !== null || (mode === "flashcard" && showContext)
      ) && (
        <div className="pt-2 text-center">
          <p className="mb-2 text-muted-foreground">
            {mode === "quiz"
              ? `Finished! Final score: ${score.correct} / ${score.total}`
              : "You've reviewed all words!"}
          </p>
          <Button variant="secondary" size="sm" onClick={resetPractice}>
            <RotateCcw className="mr-1 h-4 w-4" /> Start Over
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button variant="ghost" onClick={goNext} disabled={currentIndex === vocabList.length - 1}>
          Next <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
