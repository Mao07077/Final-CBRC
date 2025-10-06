// Flashcard AI generation using Xenova transformers.js
// Fully frontend-based — no API key, works on Render/Vercel

import { pipeline, env } from '@xenova/transformers';

// ✅ Fix: force model/tokenizer to load from Xenova CDN instead of HF
env.allowLocalModels = false;
env.remoteModels = true;
env.useBrowserCache = true;
env.allowRemoteModels = true;
env.backends.onnx.wasm.wasmPaths =
  'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/';

// Cache model to avoid reloading
let generator = null;

/**
 * Generate flashcards (Q&A) from given text
 * @param {string} text - source text for flashcards
 * @param {number} num - number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string}>>}
 */
export async function generateFlashcardsFromText(text, num = 3) {
  if (!text?.trim()) {
    throw new Error('Input text is empty. Please provide study material.');
  }

  try {
    // Load the model once
    if (!generator) {
      generator = await pipeline('text2text-generation', 'Xenova/t5-small');
    }

    const prompt = `Create ${num} educational flashcards in Q&A format from this text.
Each flashcard should look like:
Q: [question]
A: [answer]

Text:
${text}`;

    // Generate text output
    const output = await generator(prompt, {
      max_new_tokens: 256,
      temperature: 0.7,
    });

    const raw = output?.[0]?.generated_text?.trim();
    if (!raw) throw new Error('No flashcards generated. Try shorter text.');

    // Parse output into Q&A objects
    const flashcards = [];
    const regex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=\s*Q:|$)/gs;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      flashcards.push({
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }

    // Fallback if parsing fails
    if (flashcards.length === 0) {
      flashcards.push({ question: 'Unable to parse output', answer: raw });
    }

    return flashcards;
  } catch (error) {
    console.error('❌ Flashcard generation error:', error);
    throw new Error('Failed to generate flashcards. ' + error.message);
  }
}
