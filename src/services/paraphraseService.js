

// Improved paraphrasing using Datamuse API: only replace common words, skip proper nouns and function words
async function getSynonym(word) {
  try {
    const response = await fetch(`https://api.datamuse.com/words?rel_syn=${word}`);
    const data = await response.json();
    if (data && data.length > 0) {
      // Prefer synonym that is not the same as the original word
      const filtered = data.filter(item => item.word.toLowerCase() !== word.toLowerCase());
      if (filtered.length > 0) return filtered[0].word;
      return data[0].word;
    }
  } catch (e) {
    // ignore fetch errors
  }
  return word;
}

// Helper: check if a word is a proper noun (starts with uppercase and not at sentence start)
function isProperNoun(word, index, words) {
  if (!word) return false;
  if (!/^[A-Z][a-z]+$/.test(word)) return false;
  // If it's the first word, check if previous is punctuation
  if (index === 0) return false;
  // If previous word is punctuation, treat as sentence start
  if (/^[.!?]$/.test(words[index - 1])) return false;
  return true;
}


// Main paraphrase function
export async function paraphrase(text) {
  // Split by word boundaries, keep punctuation
  const words = text.split(/(\W+)/);
  const paraphrasedWords = await Promise.all(words.map(async (word, idx) => {
    // Skip function words
    if (FUNCTION_WORDS.includes(word.toLowerCase())) return word;
    // Skip proper nouns
    if (isProperNoun(word, idx, words)) return word;
    // Only replace alphabetic words longer than 2 chars
    if (/^[a-zA-Z]{3,}$/.test(word)) {
      const synonym = await getSynonym(word);
      return synonym !== word ? synonym : word;
    }
    return word;
  }));
  return paraphrasedWords.join('');
}

export default paraphraseService;
