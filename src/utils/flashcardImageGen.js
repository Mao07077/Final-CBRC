// Client-side: call the Next.js API route to generate the image
export async function generateFlashcardImage(topic) {
  try {
    const res = await fetch('/api/generate-flashcard-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to generate image');
    }
    const data = await res.json();
    return data.imageUrl;
  } catch (err) {
    console.error('Image generation error:', err);
    return null;
  }
}
