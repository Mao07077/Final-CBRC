// Flashcard AI generation using Xenova transformers.js
// Works fully offline / client-side — no Hugging Face API key or backend needed

import { pipeline } from '@xenova/transformers';

// Keep the pipeline loaded para di ulit-ulit mag-load
let generator = null;

export async function generateFlashcardsFromText(text, num = 3) {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text is empty. Please provide content to generate flashcards.');
  }

  try {
    // Load the model once (t5-base)
    if (!generator) {
      generator = await pipeline('text2text-generation', 'Xenova/t5-base');
    }

    // Instruction prompt
    const prompt = `Create ${num} educational flashcards in Q&A format from the following text. 
Each flashcard should be written as:
Q: [question]
A: [answer]

Text: ${text}`;

    // Generate flashcards
    const output = await generator(prompt, {
      max_new_tokens: 256,
      temperature: 0.7,
    });

    // Extract and clean the result
    const result = output?.[0]?.generated_text?.trim();
    if (!result) throw new Error('No flashcards generated. Try using shorter or simpler text.');

    return result;
  } catch (error) {
    console.error('❌ Flashcard generation error:', error);
    throw new Error('Failed to generate flashcards. ' + error.message);
  }
}
