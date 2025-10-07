// Flashcard AI generation using Hugging Face Inference API (Vercel-friendly)
// Requires VITE_HF_API_TOKEN in your Vercel environment variables

export async function generateFlashcardsFromText(text, num = 3) {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text is empty. Please provide content to generate flashcards.');
  }
  const endpoint = 'https://api-inference.huggingface.co/models/t5-base';
  const prompt = `Create ${num} study flashcards in Q&A format from this text:\n${text}`;
  const token = import.meta.env.VITE_HF_API_TOKEN;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ inputs: prompt })
    });
    if (!response.ok) {
      throw new Error('Hugging Face API error: ' + response.statusText);
    }
    const data = await response.json();
    if (!data || !data[0] || !data[0].generated_text) {
      throw new Error('No flashcards generated. Try a different PDF or shorter text.');
    }
    return data[0].generated_text;
  } catch (err) {
    throw new Error('Failed to generate flashcards via Hugging Face API: ' + err.message);
  }
}
