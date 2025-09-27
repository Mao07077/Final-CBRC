

async function getSynonym(word) {
  const res = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(word)}`);
  const data = await res.json();
  // Only replace if synonym is not the same as original and is a single word
  if (data.length > 0 && data[0].word.toLowerCase() !== word.toLowerCase() && !data[0].word.includes(' ')) {
    return data[0].word;
  }
  return word;
}

const paraphraseService = {
  paraphrase: async (text) => {
    const words = text.split(/(\W+)/); // Split by non-word chars to preserve punctuation
    const paraphrasedWords = await Promise.all(words.map(async w => {
      // Only try to paraphrase alphabetic words
      if (/^[a-zA-Z]+$/.test(w)) {
        return await getSynonym(w);
      }
      return w;
    }));
    return paraphrasedWords.join('');
  },
};

export default paraphraseService;
