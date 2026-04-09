"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Volume2 } from "lucide-react";

interface DictDefinition {
  definition: string;
  example?: string;
}

interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
}

interface DictResult {
  word: string;
  phonetic?: string;
  meanings: DictMeaning[];
}

interface DictionaryPopoverProps {
  word: string;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function DictionaryPopover({ word, anchorRect, onClose }: DictionaryPopoverProps) {
  const [result, setResult] = useState<DictResult | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not_found" | "error">("loading");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch definition
  useEffect(() => {
    setStatus("loading");
    setResult(null);
    const clean = word.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
    if (!clean) { setStatus("not_found"); return; }

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`)
      .then((r) => {
        if (r.status === 404) { setStatus("not_found"); return null; }
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const entry = data[0];
        setResult({
          word: entry.word,
          phonetic: entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text,
          meanings: entry.meanings.slice(0, 2).map((m: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }) => ({
            partOfSpeech: m.partOfSpeech,
            definitions: m.definitions.slice(0, 2),
          })),
        });
        setStatus("found");
      })
      .catch(() => setStatus("error"));
  }, [word]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Calculate position — prefer above the word, fall back to below
  const viewportHeight = window.innerHeight;
  const popoverHeight = 220;
  const popoverWidth = 288;

  const spaceAbove = anchorRect.top;
  const openAbove = spaceAbove > popoverHeight + 8;

  const top = openAbove
    ? anchorRect.top - popoverHeight - 8
    : anchorRect.bottom + 8;

  // Center horizontally on the word, clamp to viewport
  let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

  const content = (
    <div
      ref={popoverRef}
      style={{ top, left, width: popoverWidth, maxHeight: popoverHeight }}
      className="fixed z-[9999] overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <span className="text-base font-semibold">{word}</span>
          {result?.phonetic && (
            <span className="ml-2 text-sm text-muted-foreground">{result.phonetic}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">Looking up...</p>
        )}
        {status === "not_found" && (
          <p className="text-sm text-muted-foreground">No definition found.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-muted-foreground">Could not reach dictionary.</p>
        )}
        {status === "found" && result && (
          <div className="space-y-3">
            {result.meanings.map((meaning, mi) => (
              <div key={mi}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                  {meaning.partOfSpeech}
                </p>
                <ol className="space-y-1.5 text-sm">
                  {meaning.definitions.map((def, di) => (
                    <li key={di} className="text-foreground">
                      <span>{di + 1}. {def.definition}</span>
                      {def.example && (
                        <span className="mt-0.5 block pl-3 text-xs italic text-muted-foreground">
                          "{def.example}"
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
