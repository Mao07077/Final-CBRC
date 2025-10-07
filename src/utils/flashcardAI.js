// Flashcard AI generation using Gemini API (Vercel-friendly)
// Requires VITE_HF_API_TOKEN in your Vercel environment variables

export async function generateFlashcardsFromText(text, num = 3) {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text is empty. Please provide content to generate flashcards.');
  }
  try {
    const response = await fetch('/api/generate-flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, num })
    });
    const data = await response.json();
    // Adjust this depending on Gemini's response format
    return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
  } catch (err) {
    throw new Error('Failed to generate flashcards via Gemini API: ' + err.message);
  }
}
