import Bytez from 'bytez.js';

// Use Bytez API key from environment variable
const sdk = new Bytez(process.env.NEXT_PUBLIC_BYTEZ_KEY || process.env.BYTEZ_KEY);

// Generate an image for a given flashcard topic/question
export async function generateFlashcardImage(topic) {
  const model = sdk.model('dreamlike-art/dreamlike-photoreal-2.0');
  const input = topic;
  const { error, output } = await model.run(input);
  if (error) {
    console.error('Image generation error:', error);
    return null;
  }
  return output; // output is the image URL
}
