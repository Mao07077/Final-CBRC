
const APILAYER_API_URL = "https://api.apilayer.com/paraphraser";
const APILAYER_API_KEY = import.meta.env.VITE_APILAYER_API_KEY || ""; // Set in Vercel

const paraphraseService = {
  paraphrase: async (text) => {
    const response = await fetch(APILAYER_API_URL, {
      method: "POST",
      headers: {
        "apikey": APILAYER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });
    const result = await response.json();
    if (result && result.paraphrased) {
      return result.paraphrased;
    }
    throw new Error(result.error || "Paraphrasing failed");
  },
};

export default paraphraseService;
