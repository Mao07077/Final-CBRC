import apiClient from "../api/axiosClient";

const paraphraseService = {
  paraphrase: async (question) => {
    const response = await apiClient.post("/api/paraphrase", { question });
    return response.data.paraphrased;
  },
};

export default paraphraseService;
