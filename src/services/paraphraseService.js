
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HF_API_KEY || ""; // For Vite projects

const paraphraseService = {
  paraphrase: async (question, apiKey = HUGGINGFACE_API_KEY) => {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: question,
        parameters: { num_beams: 5, num_return_sequences: 1 }
      })
    });
    const result = await response.json();
    if (result && result.length > 0 && result[0].generated_text) {
      return result[0].generated_text;
    }
    throw new Error(result.error || "Paraphrasing failed");
  },
};

export default paraphraseService;
