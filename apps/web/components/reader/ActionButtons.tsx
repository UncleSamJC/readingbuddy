"use client";

import { Button } from "@/components/ui/button";
import { Mic, Volume2, Pause, Square, Play, SkipBack, SkipForward, RotateCcw } from "lucide-react";

export type TtsState = "idle" | "playing" | "paused";

interface ActionButtonsProps {
  onReadAloud: () => void;
  onListenDemo: () => void;
  onTtsPause: () => void;
  onTtsResume: () => void;
  onTtsStop: () => void;
  onTtsPrev: () => void;
  onTtsNext: () => void;
  onTtsRepeat: () => void;
  isRecording?: boolean;
  ttsState?: TtsState;
}

export function ActionButtons({
  onReadAloud,
  onListenDemo,
  onTtsPause,
  onTtsResume,
  onTtsStop,
  onTtsPrev,
  onTtsNext,
  onTtsRepeat,
  isRecording = false,
  ttsState = "idle",
}: ActionButtonsProps) {
  const isTtsActive = ttsState !== "idle";

  return (
    <div className="flex gap-2">
      {/* Read Aloud — fixed 30% width */}
      <Button
        onClick={onReadAloud}
        variant={isRecording ? "destructive" : "default"}
        className="h-12 w-[30%] shrink-0 gap-1.5 text-sm"
        disabled={isTtsActive}
      >
        <Mic className="h-4 w-4" />
        <span className="hidden xs:inline">{isRecording ? "Stop" : "Read Aloud"}</span>
        <span className="xs:hidden">{isRecording ? "Stop" : "Read Aloud"}</span>
      </Button>

      {/* TTS area — remaining 70% */}
      <div className="flex flex-1 gap-1">
        {!isTtsActive ? (
          /* Idle: single Listen button */
          <Button
            onClick={onListenDemo}
            variant="secondary"
            className="h-12 flex-1 gap-1.5 text-sm"
            disabled={isRecording}
          >
            <Volume2 className="h-4 w-4" />
            <span>Listen</span>
          </Button>
        ) : (
          /* Active: Prev · Repeat · Play/Pause · Next · Stop */
          <>
            <Button
              onClick={onTtsPrev}
              variant="secondary"
              size="icon"
              className="h-12 flex-1"
              title="Previous sentence"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={onTtsRepeat}
              variant="secondary"
              size="icon"
              className="h-12 flex-1"
              title="Repeat sentence"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={ttsState === "playing" ? onTtsPause : onTtsResume}
              variant="secondary"
              size="icon"
              className="h-12 flex-1"
              title={ttsState === "playing" ? "Pause" : "Resume"}
            >
              {ttsState === "playing"
                ? <Pause className="h-4 w-4" />
                : <Play className="h-4 w-4" />}
            </Button>

            <Button
              onClick={onTtsNext}
              variant="secondary"
              size="icon"
              className="h-12 flex-1"
              title="Next sentence"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              onClick={onTtsStop}
              variant="secondary"
              size="icon"
              className="h-12 flex-1"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
