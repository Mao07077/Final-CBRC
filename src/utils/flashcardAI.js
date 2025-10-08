// Hugging Face transformers.js (t5-base) in-browser flashcard generation
import { pipeline } from '@xenova/transformers';

let summarizer;

export async function generateFlashcards(moduleContent) {
  if (!summarizer) {
    summarizer = await pipeline('summarization', 'Xenova/t5-base');
  }
  // T5 expects a prefix for summarization tasks
  const input = `summarize: ${moduleContent}`;
  const output = await summarizer(input, { max_length: 120, min_length: 20 });
  // You can further process output[0].summary_text to split into Q&A pairs if needed
  return output[0].summary_text;
}
