// Compare spoken transcript against original text, word by word

export type WordStatus = "unread" | "correct" | "incorrect";

export interface WordMatch {
  word: string;
  status: WordStatus;
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

/**
 * Compare transcript words against original paragraph words.
 * Returns per-word status for the original text.
 */
export function diffWords(original: string, transcript: string): WordMatch[] {
  const origWords = original.split(/\s+/).filter(Boolean);
  const spokenWords = transcript
    .split(/\s+/)
    .filter(Boolean)
    .map(normalize);

  let spokenIdx = 0;

  return origWords.map((word) => {
    if (spokenIdx >= spokenWords.length) {
      return { word, status: "unread" as const };
    }

    const normOrig = normalize(word);
    if (!normOrig) {
      return { word, status: "unread" as const };
    }

    // Exact match
    if (normOrig === spokenWords[spokenIdx]) {
      spokenIdx++;
      return { word, status: "correct" as const };
    }

    // Look ahead 1 in spoken words (child may have skipped)
    if (spokenIdx + 1 < spokenWords.length && normOrig === spokenWords[spokenIdx + 1]) {
      spokenIdx += 2;
      return { word, status: "correct" as const };
    }

    // Look ahead 1 in original words (child may have inserted extra)
    // Mark current as incorrect and advance spoken
    spokenIdx++;
    return { word, status: "incorrect" as const };
  });
}

/**
 * Count how many words have been read (correct + incorrect).
 */
export function readProgress(matches: WordMatch[]): {
  total: number;
  read: number;
  correct: number;
  incorrect: number;
} {
  const total = matches.length;
  const correct = matches.filter((m) => m.status === "correct").length;
  const incorrect = matches.filter((m) => m.status === "incorrect").length;
  return { total, read: correct + incorrect, correct, incorrect };
}
