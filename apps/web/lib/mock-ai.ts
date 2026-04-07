// Mock AI service for development — simulates streaming responses

type Intent = "vocabulary" | "sentence" | "story" | "praise" | "general";

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  if (lower.includes("what does this mean") || lower.includes("what does \""))
    return "sentence";
  if (
    lower.includes("word") ||
    lower.includes("meaning") ||
    lower.includes("define") ||
    lower.includes("vocabulary")
  )
    return "vocabulary";
  if (
    lower.includes("why") ||
    lower.includes("what happen") ||
    lower.includes("who is") ||
    lower.includes("story") ||
    lower.includes("character")
  )
    return "story";
  if (lower.includes("read") || lower.includes("practice"))
    return "praise";
  return "general";
}

const RESPONSES: Record<Intent, string[]> = {
  sentence: [
    'Great question! This sentence means that the character is feeling something very strong inside. Let me break it down:\n1. The first part sets the scene\n2. The second part shows the emotion\n3. Together they tell us something important about the character!',
    "That's a really interesting sentence! The author uses beautiful words here to paint a picture in our mind. Can you try reading it out loud one more time?",
    'Let me explain this for you! This is a longer sentence, but we can break it into smaller pieces. The key word here helps connect the two ideas together.',
  ],
  vocabulary: [
    'Great word to ask about! This word means something like "to do something with great care." You might hear it in sentences like "She carefully opened the box." Can you think of a time you did something carefully?',
    "That's a wonderful word! It comes from an old language and it means something special. Try using it in your own sentence!",
    "Good question! This is a word that describes how something looks or feels. When you see this word in the book, imagine the picture it creates in your mind.",
  ],
  story: [
    "That's a great question about the story! The character did this because they were trying to protect something important. What do you think will happen next?",
    "You're really thinking deeply about the story! This happened because of something earlier in the chapter. Do you remember when the character first arrived?",
    "I love that you're curious about this! The author is showing us that sometimes things are not what they seem. The character is learning an important lesson here.",
  ],
  praise: [
    "You're doing amazing! I can tell you've been practicing. Keep up the great work, and remember — every time you read, you get a little bit better!",
    "Wonderful reading! Your pronunciation is getting so much better. I'm really proud of how hard you're working!",
    "Fantastic job! You read that passage really well. Would you like to try the next paragraph?",
  ],
  general: [
    "That's a great question! Let me help you with that. This part of the book is really interesting because it teaches us something new.",
    "I'm glad you asked! Let's explore this together. What part would you like to look at more closely?",
    "Good thinking! Roz loves curious readers. Let's dive into this part of the story together!",
  ],
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getMockResponse(message: string): string {
  const intent = detectIntent(message);
  return pickRandom(RESPONSES[intent]);
}

/**
 * Simulate streaming by calling onChunk with progressively longer text.
 * Returns a cancel function.
 */
export function streamMockResponse(
  message: string,
  onChunk: (partialText: string) => void,
  onDone: (fullText: string) => void
): () => void {
  const fullText = getMockResponse(message);
  let index = 0;
  let cancelled = false;

  function tick() {
    if (cancelled) return;

    // Stream 1-3 characters at a time for natural feel
    const chunkSize = Math.random() < 0.3 ? 1 : Math.random() < 0.6 ? 2 : 3;
    index = Math.min(index + chunkSize, fullText.length);
    onChunk(fullText.slice(0, index));

    if (index < fullText.length) {
      // Variable speed: pause longer at punctuation
      const char = fullText[index - 1];
      const delay = ".!?\n".includes(char) ? 80 : 20 + Math.random() * 20;
      setTimeout(tick, delay);
    } else {
      onDone(fullText);
    }
  }

  // Initial delay before streaming starts
  setTimeout(tick, 300);

  return () => {
    cancelled = true;
  };
}
