// Next.js API route for Bytez image generation (server-side only)
import Bytez from 'bytez.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }
  try {
    const sdk = new Bytez(process.env.NEXT_PUBLIC_BYTEZ_KEY || process.env.BYTEZ_KEY);
    const model = sdk.model('dreamlike-art/dreamlike-photoreal-2.0');
    const { error, output } = await model.run(topic);
    if (error) {
      return res.status(500).json({ error: error.message || error });
    }
    return res.status(200).json({ imageUrl: output });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
