"use client";

import { useCallback, useRef, useState } from "react";
import { useAppStore, TTS_VOICES, TTS_SPEED_OPTIONS, type TtsVoiceId } from "@/lib/store";
import { fetchTtsAudio } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Volume2, Check } from "lucide-react";

const PREVIEW_TEXT = "Hello! I am Roz, your reading teacher. Let's read together!";

export default function SettingsPage() {
  const ttsVoice = useAppStore((s) => s.ttsVoice);
  const ttsSpeed = useAppStore((s) => s.ttsSpeed);
  const setTtsVoice = useAppStore((s) => s.setTtsVoice);
  const setTtsSpeed = useAppStore((s) => s.setTtsSpeed);

  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = useCallback(async (voiceId: string) => {
    // Stop current preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPreviewingVoice(voiceId);
    try {
      const url = await fetchTtsAudio(PREVIEW_TEXT, voiceId, ttsSpeed);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPreviewingVoice(null); audioRef.current = null; };
      audio.onerror = () => { setPreviewingVoice(null); audioRef.current = null; };
      await audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  }, [ttsSpeed]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Voice selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a voice for reading aloud. Tap the play button to preview.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TTS_VOICES.map((v) => {
            const isSelected = ttsVoice === v.id;
            const isPreviewing = previewingVoice === v.id;

            return (
              <div
                key={v.id}
                onClick={() => setTtsVoice(v.id as TtsVoiceId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setTtsVoice(v.id as TtsVoiceId); }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{v.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.desc}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(v.id);
                  }}
                >
                  <Volume2 className={cn(
                    "h-4 w-4",
                    isPreviewing && "animate-pulse text-primary"
                  )} />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Speed selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reading Speed</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust how fast the voice reads.
          </p>
        </CardHeader>
        <CardContent className="flex gap-2">
          {TTS_SPEED_OPTIONS.map((opt) => {
            const isSelected = ttsSpeed === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTtsSpeed(opt.value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-3 text-center text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {opt.label}
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.value}x</p>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
