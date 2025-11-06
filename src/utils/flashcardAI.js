// Flashcard AI generation using Gemini API via secure backend route
// Frontend calls the Render backend's /generate-flashcards endpoint

let BACKEND_URL = import.meta.env.VITE_API_URL;
if (BACKEND_URL && BACKEND_URL.endsWith('/')) {
  BACKEND_URL = BACKEND_URL.slice(0, -1);
}

export async function generateFlashcardsFromText(text, num = 3, moduleId = null, generatedBy = null) {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text is empty. Please provide content to generate flashcards.');
  }
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not set. Please set VITE_API_URL in your environment variables.');
  }
  try {
    const body = { text, num };
    if (moduleId) body.module_id = moduleId;
    if (generatedBy) body.generated_by = generatedBy;

    const response = await fetch(`${BACKEND_URL}/generate-flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // Adjust this depending on Gemini's response format
    return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
  } catch (err) {
    throw new Error('Failed to generate flashcards via Gemini API: ' + err.message);
  }
}
