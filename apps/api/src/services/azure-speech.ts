// Azure Cognitive Services - Pronunciation Assessment
// TODO: Integrate Azure Speech SDK when moving to Phase 2

export interface AssessmentResult {
  accuracyScore: number;
  fluencyScore: number;
  words: {
    word: string;
    accuracyScore: number;
    errorType: "None" | "Mispronunciation" | "Omission" | "Insertion";
  }[];
}

export async function assessPronunciation(
  _audioBuffer: Buffer,
  _referenceText: string
): Promise<AssessmentResult> {
  // Placeholder: return mock result until Azure SDK is integrated
  return {
    accuracyScore: 0,
    fluencyScore: 0,
    words: [],
  };
}
