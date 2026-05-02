"use client";

import { use, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useSpeech } from "@/lib/use-speech";
import { streamChat, fetchTtsAudio } from "@/lib/api";
import { diffWords, type WordMatch } from "@/lib/text-diff";
import { BookContent, splitSentences, type BookContentHandle } from "@/components/reader/BookContent";
import { ActionButtons, type TtsState } from "@/components/reader/ActionButtons";
import { ChapterSelector } from "@/components/reader/ChapterSelector";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ReadingResult } from "@/components/reader/ReadingResult";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Highlighter, BotMessageSquare, Home } from "lucide-react";
import type { ChatMessage } from "@readbuddy/shared-types";
import { useAuth } from "@/lib/auth-context";
import { ConsentDialog, chatConsentKey } from "@/components/AIConsentDialog";

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chapterId } = use(params);
  const router = useRouter();
  const cancelStreamRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bookContentRef = useRef<BookContentHandle>(null);

  // Store
  const chapters = useAppStore((s) => s.chapters);
  const currentBook = useAppStore((s) => s.currentBook);
  const messages = useAppStore((s) => s.messages);
  const isAiLoading = useAppStore((s) => s.isAiLoading);
  const streamingMessageId = useAppStore((s) => s.streamingMessageId);
  const addMessage = useAppStore((s) => s.addMessage);
  const updateMessageContent = useAppStore((s) => s.updateMessageContent);
  const setStreamingMessageId = useAppStore((s) => s.setStreamingMessageId);
  const setIsAiLoading = useAppStore((s) => s.setIsAiLoading);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const markChapterRead = useAppStore((s) => s.markChapterRead);
  const markedWords = useAppStore((s) => s.markedWords);
  const toggleMarkedWord = useAppStore((s) => s.toggleMarkedWord);
  const ttsVoice = useAppStore((s) => s.ttsVoice);
  const ttsSpeed = useAppStore((s) => s.ttsSpeed);
  const chatUsage = useAppStore((s) => s.chatUsage);
  const chatLimit = useAppStore((s) => s.chatLimit);
  const setChatUsage = useAppStore((s) => s.setChatUsage);
  const userPlan = useAppStore((s) => s.userPlan);
  const rozLanguage = useAppStore((s) => s.rozLanguage);

  // Local state
  const { user } = useAuth();
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showChatConsent, setShowChatConsent] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [wordMatches, setWordMatches] = useState<WordMatch[] | null>(null);
  const [readingResult, setReadingResult] = useState<WordMatch[] | null>(null);
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [ttsSentenceIndex, setTtsSentenceIndex] = useState<number | null>(null);
  const ttsAbortRef = useRef(false);
  const ttsGenerationRef = useRef(0);          // incremented on each new playback session
  const ttsCurrentPosRef = useRef({ paragraphIndex: 0, sentenceIndex: 0 });
  const ttsCacheRef = useRef<Map<string, string>>(new Map()); // sentence → blob URL
  const ttsCacheOrderRef = useRef<string[]>([]);               // insertion order for eviction
  const TTS_CACHE_SIZE = 3;

  // Chapter data
  const chapter = useMemo(
    () =>
      chapters.find((ch) => ch.id === chapterId) ??
      chapters.find((ch) => String(ch.chapter_num) === chapterId),
    [chapters, chapterId]
  );
  const paragraphs = useMemo(
    () => (chapter ? splitParagraphs(chapter.raw_text) : []),
    [chapter]
  );

  // ── TTS cache helpers ──

  const clearTtsCache = useCallback(() => {
    ttsCacheRef.current.clear();
    ttsCacheOrderRef.current = [];
  }, []);

  // Check cache first; fetch and store on miss. Evicts oldest when cache is full.
  const cacheFetch = useCallback(async (sentence: string): Promise<string> => {
    const cache = ttsCacheRef.current;
    const order = ttsCacheOrderRef.current;
    if (cache.has(sentence)) return cache.get(sentence)!;

    const url = await fetchTtsAudio(sentence, ttsVoice, ttsSpeed);

    while (order.length >= TTS_CACHE_SIZE) {
      const evicted = order.shift()!;
      cache.delete(evicted);
    }
    cache.set(sentence, url);
    order.push(sentence);
    return url;
  }, [ttsVoice, ttsSpeed]);

  // Clear cache when voice/speed changes (cached audio is for old settings)
  useEffect(() => {
    clearTtsCache();
  }, [ttsVoice, ttsSpeed, clearTtsCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsAbortRef.current = true;
      audioRef.current?.pause();
      cancelStreamRef.current?.();
      clearTtsCache();
    };
  }, [clearTtsCache]);

  // Track reading progress
  useEffect(() => {
    if (chapter) {
      markChapterRead(chapter.id, activeParagraph);
    }
  }, [chapter, activeParagraph, markChapterRead]);

  // Speech recognition
  const { isRecording, isSupported, toggle: toggleRecording } = useSpeech({
    onTranscript: useCallback(
      (transcript: string) => {
        const originalText = paragraphs[activeParagraph] ?? "";
        setWordMatches(diffWords(originalText, transcript));
      },
      [paragraphs, activeParagraph]
    ),
    onEnd: useCallback(
      (fullTranscript: string) => {
        const originalText = paragraphs[activeParagraph] ?? "";
        const finalMatches = diffWords(originalText, fullTranscript);
        setWordMatches(null);
        setReadingResult(finalMatches);

        // Reading result is shown inline — no need to activate Roz automatically
      },
      [paragraphs, activeParagraph]
    ),
  });

  // ── Chat (real Claude SSE) ──

  const handleSendMessage = useCallback(
    (text: string) => {
      cancelStreamRef.current?.();

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      addMessage(userMsg);
      setIsAiLoading(true);

      const aiMsgId = crypto.randomUUID();
      addMessage({
        id: aiMsgId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      });
      setStreamingMessageId(aiMsgId);

      // Build history from current messages (before adding new ones)
      const currentMessages = useAppStore.getState().messages;
      const history = currentMessages
        .filter((m) => m.content && m.id !== aiMsgId)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const bookId = currentBook?.id;
      if (!bookId) {
        updateMessageContent(aiMsgId, "No book found. Please set up a book first.");
        setStreamingMessageId(null);
        setIsAiLoading(false);
        return;
      }

      let fullText = "";
      cancelStreamRef.current = streamChat(
        text,
        bookId,
        history,
        (chunk) => {
          fullText += chunk;
          updateMessageContent(aiMsgId, fullText);
        },
        (didSucceed) => {
          setStreamingMessageId(null);
          setIsAiLoading(false);
          cancelStreamRef.current = null;
          if (didSucceed) setChatUsage(chatUsage + 1);
        },
        chapter?.id,
        rozLanguage,
        (used, limit) => {
          updateMessageContent(aiMsgId, `Monthly limit reached (${used}/${limit} sessions). Resets on the 1st of next month.`);
          setChatUsage(used);
        }
      );
    },
    [addMessage, updateMessageContent, setStreamingMessageId, setIsAiLoading, currentBook?.id, chapter?.id, rozLanguage, chatUsage, setChatUsage]
  );

  // ── TTS (sentence-by-sentence with pre-fetching) ──

  // Core TTS loop — accepts explicit start position and a generation id to detect stale runs
  const runTtsFrom = useCallback(async (
    startParagraphIndex: number,
    startSentenceIndex: number,
    gen: number,
  ) => {
    setTtsState("playing");
    let nextAudioPromise: Promise<string> | null = null;

    // Reuse a single Audio element for the whole session so iOS Safari keeps
    // it "unlocked" after the first user-gesture-triggered play().
    const audio = new Audio();
    audioRef.current = audio;

    outer: for (let pIdx = startParagraphIndex; pIdx < paragraphs.length; pIdx++) {
      if (ttsGenerationRef.current !== gen) break;

      const text = paragraphs[pIdx];
      if (!text?.trim()) continue;

      setActiveParagraph(pIdx);
      const sentences = splitSentences(text);
      if (sentences.length === 0) continue;

      const startSentence = pIdx === startParagraphIndex
        ? Math.min(startSentenceIndex, sentences.length - 1)
        : 0;

      if (!nextAudioPromise) {
        nextAudioPromise = cacheFetch(sentences[startSentence].trim());
      }

      for (let i = startSentence; i < sentences.length; i++) {
        if (ttsGenerationRef.current !== gen) break outer;

        setTtsSentenceIndex(i);
        ttsCurrentPosRef.current = { paragraphIndex: pIdx, sentenceIndex: i };

        try {
          const url = await nextAudioPromise!;

          // Pre-fetch next sentence or first sentence of next paragraph
          if (i + 1 < sentences.length) {
            nextAudioPromise = cacheFetch(sentences[i + 1].trim());
          } else {
            nextAudioPromise = null;
            for (let nextP = pIdx + 1; nextP < paragraphs.length; nextP++) {
              const nextText = paragraphs[nextP];
              if (nextText?.trim()) {
                const ns = splitSentences(nextText);
                if (ns.length > 0) nextAudioPromise = cacheFetch(ns[0].trim());
                break;
              }
            }
          }

          if (ttsGenerationRef.current !== gen) break outer;

          // Change src on the same element — keeps iOS audio session unlocked
          audio.src = url;
          await new Promise<void>((resolve, reject) => {
            audio.addEventListener("ended", () => resolve(), { once: true });
            audio.addEventListener("error", (e) => {
              console.error(`[TTS] p=${pIdx} s=${i}: audio error`, e);
              reject(new Error("audio_error"));
            }, { once: true });
            audio.play().catch((err) => {
              console.error(`[TTS] p=${pIdx} s=${i}: play() rejected`, err);
              reject(err);
            });
          });
        } catch (err) {
          console.error(`[TTS] p=${pIdx} s=${i}: stopped`, err);
          break outer;
        }
      }
    }

    if (ttsGenerationRef.current === gen) {
      audioRef.current = null;
      setTtsSentenceIndex(null);
      setTtsState("idle");
    }
  }, [paragraphs, cacheFetch]);

  // Stop current session and start a new one from given position
  const restartTtsFrom = useCallback((paragraphIndex: number, sentenceIndex: number) => {
    ttsGenerationRef.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    const gen = ttsGenerationRef.current;
    runTtsFrom(paragraphIndex, sentenceIndex, gen);
  }, [runTtsFrom]);

  const handleListenDemo = useCallback(() => {
    if (ttsState !== "idle") return;
    const startPos = bookContentRef.current?.getFirstVisiblePosition() ?? {
      paragraphIndex: activeParagraph,
      sentenceIndex: 0,
    };
    if (!paragraphs[startPos.paragraphIndex]) return;
    ttsGenerationRef.current += 1;
    runTtsFrom(startPos.paragraphIndex, startPos.sentenceIndex, ttsGenerationRef.current);
  }, [paragraphs, activeParagraph, ttsState, runTtsFrom]);

  const handleTtsPause = useCallback(() => {
    audioRef.current?.pause();
    setTtsState("paused");
  }, []);

  const handleTtsResume = useCallback(() => {
    audioRef.current?.play();
    setTtsState("playing");
  }, []);

  const handleTtsStop = useCallback(() => {
    ttsGenerationRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTtsSentenceIndex(null);
    setTtsState("idle");
  }, []);

  const handleTtsRepeat = useCallback(() => {
    restartTtsFrom(ttsCurrentPosRef.current.paragraphIndex, ttsCurrentPosRef.current.sentenceIndex);
  }, [restartTtsFrom]);

  const handleTtsPrev = useCallback(() => {
    const { paragraphIndex, sentenceIndex } = ttsCurrentPosRef.current;
    if (sentenceIndex > 0) {
      restartTtsFrom(paragraphIndex, sentenceIndex - 1);
    } else {
      // Go to last sentence of previous non-empty paragraph
      for (let p = paragraphIndex - 1; p >= 0; p--) {
        const text = paragraphs[p];
        if (text?.trim()) {
          const sentences = splitSentences(text);
          restartTtsFrom(p, Math.max(0, sentences.length - 1));
          return;
        }
      }
    }
  }, [paragraphs, restartTtsFrom]);

  const handleTtsNext = useCallback(() => {
    const { paragraphIndex, sentenceIndex } = ttsCurrentPosRef.current;
    const text = paragraphs[paragraphIndex];
    const sentences = text ? splitSentences(text) : [];
    if (sentenceIndex < sentences.length - 1) {
      restartTtsFrom(paragraphIndex, sentenceIndex + 1);
    } else {
      // Go to first sentence of next non-empty paragraph
      for (let p = paragraphIndex + 1; p < paragraphs.length; p++) {
        const nextText = paragraphs[p];
        if (nextText?.trim()) {
          restartTtsFrom(p, 0);
          return;
        }
      }
    }
  }, [paragraphs, restartTtsFrom]);

  // ── Actions ──

  const handleSentenceClick = useCallback(
    (sentence: string) => {
      if (!showChat) return;
      handleSendMessage(`What does this mean: "${sentence}"`);
    },
    [showChat, handleSendMessage]
  );

  const handleChapterSwitch = useCallback(
    (id: string) => {
      cancelStreamRef.current?.();
      handleTtsStop();
      clearTtsCache();
      clearMessages();
      setActiveParagraph(0);
      setWordMatches(null);
      setReadingResult(null);
      router.push(`/read/${id}`);
    },
    [clearMessages, router, handleTtsStop, clearTtsCache]
  );

  const handleReadAloud = useCallback(() => {
    if (!isSupported) {
      handleSendMessage("Speech recognition is not supported in this browser.");
      setShowChat(true);
      return;
    }
    setReadingResult(null);
    toggleRecording();
  }, [isSupported, toggleRecording, handleSendMessage]);

  // ── Word marking ──

  const markedWordsSet = useMemo(
    () => new Set(markedWords.map((w) => w.word.toLowerCase())),
    [markedWords]
  );

  const handleWordMark = useCallback(
    (word: string, sentence: string) => {
      toggleMarkedWord(word, sentence, chapter?.title ?? "");
      // Play the word immediately via TTS (no cache, one-shot)
      fetchTtsAudio(word, ttsVoice, ttsSpeed).then((url) => {
        const audio = new Audio(url);
        audio.play().catch(() => {});
      }).catch(() => {});
    },
    [toggleMarkedWord, chapter?.title, ttsVoice, ttsSpeed]
  );

  const handleRetryReading = useCallback(() => {
    setReadingResult(null);
    setWordMatches(null);
    toggleRecording();
  }, [toggleRecording]);

  // ── Guards ──

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <p className="text-lg text-muted-foreground">
          No book set up yet. Add chapters first!
        </p>
        <Button onClick={() => router.push("/books/setup")}>Go to Book Setup</Button>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20 text-center">
        <p className="text-lg text-muted-foreground">Chapter not found.</p>
        <Button onClick={() => router.push(`/read/${chapters[0].id}`)}>
          Go to Chapter 1
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Back to Home"
          >
            <Home className="h-4 w-4" />
          </Button>
          <h1 className="truncate text-xl font-bold">{currentBook?.title ?? "My Book"}</h1>
        </div>
        <Button
          variant={isMarkingMode ? "default" : "secondary"}
          size="sm"
          onClick={() => setIsMarkingMode((prev) => !prev)}
          className="shrink-0 gap-1.5"
        >
          <Highlighter className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isMarkingMode ? "Done Marking" : "Mark Words"}
          </span>
        </Button>
      </div>

      {/* Chapter selector — shows title + allows switching */}
      <ChapterSelector
        chapters={chapters}
        activeChapterId={chapter.id}
        onSelect={handleChapterSwitch}
      />

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening... Read the highlighted paragraph aloud
        </div>
      )}

      {/* Marking mode indicator */}
      {isMarkingMode && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          <span>Tap words to mark for practice ({markedWords.length} marked)</span>
        </div>
      )}

      {/* Book content */}
      <BookContent
        ref={bookContentRef}
        paragraphs={paragraphs}
        activeParagraphIndex={activeParagraph}
        onParagraphClick={setActiveParagraph}
        onSentenceClick={isRecording || isMarkingMode ? undefined : handleSentenceClick}
        wordMatches={isRecording || wordMatches ? wordMatches ?? undefined : undefined}
        isMarkingMode={isMarkingMode}
        markedWordsSet={markedWordsSet}
        onWordMark={handleWordMark}
        ttsSentenceIndex={ttsSentenceIndex}
      />

      {/* Reading result */}
      {readingResult && !isRecording && (
        <ReadingResult
          matches={readingResult}
          onRetry={handleRetryReading}
          onDismiss={() => setReadingResult(null)}
        />
      )}

      {/* Action buttons */}
      <ActionButtons
        onReadAloud={handleReadAloud}
        onListenDemo={handleListenDemo}
        onTtsPause={handleTtsPause}
        onTtsResume={handleTtsResume}
        onTtsStop={handleTtsStop}
        onTtsPrev={handleTtsPrev}
        onTtsNext={handleTtsNext}
        onTtsRepeat={handleTtsRepeat}
        isRecording={isRecording}
        ttsState={ttsState}
      />

      {/* Chat consent dialog */}
      <ConsentDialog
        open={showChatConsent}
        title="Before continuing"
        description="Your message and book content will be sent to Anthropic (Claude AI) to generate Roz's response. No personal or contact information is shared."
        onAgree={() => {
          if (user) localStorage.setItem(chatConsentKey(user.id), "true");
          setShowChatConsent(false);
          setShowChat(true);
        }}
        onCancel={() => setShowChatConsent(false)}
      />

      {/* Floating Ask Roz button */}
      {!showChat && (
        <button
          onClick={() => {
            if (user && localStorage.getItem(chatConsentKey(user.id))) {
              setShowChat(true);
            } else {
              setShowChatConsent(true);
            }
          }}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
        >
          <BotMessageSquare className="h-4 w-4" />
          Ask Roz
        </button>
      )}

      {/* Chat panel */}
      {showChat && (
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isAiLoading}
          streamingMessageId={streamingMessageId}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Free plan upgrade dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>Feature Unavailable</DialogTitle>
            <DialogDescription className="pt-1">
              Free users cannot use Ask Roz. If you need this feature, please contact the administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowUpgradeDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
