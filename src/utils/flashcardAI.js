// Flashcard AI generation using Hugging Face transformers.js
// Place in src/utils/flashcardAI.js

import { pipeline } from '@xenova/transformers';

export async function generateFlashcardsFromText(text, num = 3) {
  let generator;
  try {
    generator = await pipeline('text2text-generation', 'Xenova/t5-base');
  } catch (err) {
    throw new Error('Failed to load AI model. Please check your internet connection or try again later.');
  }
  // Prompt for flashcard creation
  const prompt = `Create ${num} study flashcards in Q&A format from this text:\n${text}`;
  let result;
  try {
    result = await generator(prompt, { max_new_tokens: 100 });
  } catch (err) {
    throw new Error('AI generation failed. Please try again or use a shorter PDF.');
  }
  // Returns the raw generated text (Q&A pairs)
  return result[0].generated_text;
}
