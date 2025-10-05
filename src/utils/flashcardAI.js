// Flashcard AI generation using Hugging Face transformers.js
// Place in src/utils/flashcardAI.js

import { pipeline } from '@xenova/transformers';

export async function generateFlashcardsFromText(text, num = 3) {
  // Load the question generation model (T5)
  const generator = await pipeline('text2text-generation', 'Xenova/t5-small');
  // Prompt for flashcard creation
  const prompt = `Create ${num} study flashcards in Q&A format from this text:\n${text}`;
  const result = await generator(prompt, { max_new_tokens: 100 });
  // Returns the raw generated text (Q&A pairs)
  return result[0].generated_text;
}
