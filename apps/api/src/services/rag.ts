// RAG service - Phase 1
// Phase 0 uses full-text injection into system prompt (no RAG needed)
// This module will be implemented when book content exceeds context window limits

import { supabase } from "../db/supabase.js";

export async function searchRelevantParagraphs(
  bookId: string,
  query: string,
  topK: number = 3
): Promise<string[]> {
  // Phase 0: Return all paragraphs (full-text injection)
  const { data } = await supabase
    .from("paragraphs")
    .select("content")
    .eq("chapter_id", bookId)
    .order("para_index")
    .limit(topK);

  return (data ?? []).map((p) => p.content);
}
