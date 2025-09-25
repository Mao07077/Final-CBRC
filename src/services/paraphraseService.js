

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ""; // Set in Vercel

const paraphraseService = {
  paraphrase: async (text) => {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that paraphrases quiz questions."
          },
          {
            role: "user",
            content: `Paraphrase this quiz question: ${text}`
          }
        ],
        max_tokens: 100
      })
    });
    const result = await response.json();
    if (result && result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content.trim();
    }
    throw new Error(result.error?.message || "Paraphrasing failed");
  },
};

export default paraphraseService;
