// Extract "interesting" vocabulary from book text for practice

// Common words to skip (simplified stop word list)
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "and", "but", "or", "if", "because", "until", "while", "that", "this",
  "these", "those", "it", "its", "i", "me", "my", "we", "us", "our",
  "you", "your", "he", "him", "his", "she", "her", "they", "them", "their",
  "what", "which", "who", "whom", "up", "down", "about", "just", "now",
  "said", "like", "got", "get", "go", "went", "come", "came", "know",
  "knew", "see", "saw", "look", "looked", "make", "made", "take", "took",
]);

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z'-]/g, "");
}

export interface VocabWord {
  word: string;
  /** Sentence from the book containing this word */
  context: string;
  /** Which chapter it comes from */
  chapterTitle: string;
}

/**
 * Extract vocabulary words from chapters.
 * Picks words that are 5+ letters, not common stop words, and appear at least once.
 */
export function extractVocabulary(
  chapters: { title: string; raw_text: string }[],
  maxWords: number = 20
): VocabWord[] {
  const wordMap = new Map<string, VocabWord>();

  for (const chapter of chapters) {
    // Split into sentences
    const sentences = chapter.raw_text.match(/[^.!?]+[.!?]+/g) ?? [chapter.raw_text];

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      for (const raw of words) {
        const word = normalize(raw);
        if (word.length < 5) continue;
        if (STOP_WORDS.has(word)) continue;
        if (wordMap.has(word)) continue;

        wordMap.set(word, {
          word,
          context: sentence.trim(),
          chapterTitle: chapter.title,
        });
      }
    }
  }

  // Shuffle and take maxWords
  const all = Array.from(wordMap.values());
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, maxWords);
}

/**
 * Generate a fill-in-the-blank quiz from a VocabWord.
 */
export function makeBlankSentence(vocab: VocabWord): {
  sentence: string;
  answer: string;
} {
  const regex = new RegExp(`\\b${vocab.word}\\b`, "i");
  const sentence = vocab.context.replace(regex, "_____");
  return { sentence, answer: vocab.word };
}
