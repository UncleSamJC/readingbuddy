"use client";

import { Button } from "@/components/ui/button";
import { Mic, Volume2, Pause, Square, Play } from "lucide-react";

export type TtsState = "idle" | "playing" | "paused";

interface ActionButtonsProps {
  onReadAloud: () => void;
  onListenDemo: () => void;
  onTtsPause: () => void;
  onTtsResume: () => void;
  onTtsStop: () => void;
  isRecording?: boolean;
  ttsState?: TtsState;
}

export function ActionButtons({
  onReadAloud,
  onListenDemo,
  onTtsPause,
  onTtsResume,
  onTtsStop,
  isRecording = false,
  ttsState = "idle",
}: ActionButtonsProps) {
  const isTtsActive = ttsState !== "idle";

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      {/* Read Aloud */}
      <Button
        onClick={onReadAloud}
        variant={isRecording ? "destructive" : "default"}
        className="h-auto min-h-[3rem] flex-1 flex-col gap-1 py-2.5 text-sm sm:flex-row sm:gap-2 sm:py-5 sm:text-base"
        disabled={isTtsActive}
      >
        <Mic className="h-5 w-5" />
        <span>{isRecording ? "Stop" : "Read Aloud"}</span>
      </Button>

      {/* Listen / TTS controls */}
      {!isTtsActive ? (
        <Button
          onClick={onListenDemo}
          variant="secondary"
          className="h-auto min-h-[3rem] flex-1 flex-col gap-1 py-2.5 text-sm sm:flex-row sm:gap-2 sm:py-5 sm:text-base"
          disabled={isRecording}
        >
          <Volume2 className="h-5 w-5" />
          <span>Listen</span>
        </Button>
      ) : (
        <div className="flex flex-1 gap-1">
          <Button
            onClick={ttsState === "playing" ? onTtsPause : onTtsResume}
            variant="secondary"
            className="h-auto min-h-[3rem] flex-1 flex-col gap-1 py-2.5 text-sm sm:flex-row sm:gap-2 sm:py-5 sm:text-base"
          >
            {ttsState === "playing" ? (
              <><Pause className="h-5 w-5" /><span>Pause</span></>
            ) : (
              <><Play className="h-5 w-5" /><span>Play</span></>
            )}
          </Button>
          <Button
            onClick={onTtsStop}
            variant="secondary"
            className="h-auto min-h-[3rem] py-2.5"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
