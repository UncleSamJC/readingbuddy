"use client";

import { useCallback, useRef, useState } from "react";

interface UseSpeechOptions {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onEnd: (fullTranscript: string) => void;
  lang?: string;
}

export function useSpeech({ onTranscript, onEnd, lang = "en-US" }: UseSpeechOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        parts.push(event.results[i][0].transcript);
      }
      const transcript = parts.join(" ");
      const isFinal = event.results[event.results.length - 1].isFinal;
      transcriptRef.current = transcript;
      onTranscript(transcript, isFinal);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => {
      setIsRecording(false);
      onEnd(transcriptRef.current);
    };

    recognitionRef.current = recognition;
    transcriptRef.current = "";
    recognition.start();
    setIsRecording(true);
  }, [onTranscript, onEnd, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  return { isRecording, isSupported, start, stop, toggle };
}
