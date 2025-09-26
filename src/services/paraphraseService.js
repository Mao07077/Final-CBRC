


// List of common function words to skip
const skipWords = new Set([
  'the','a','an','of','in','on','at','for','to','with','by','and','or','but','was','is','are','were','be','been','being','this','that','these','those','who','what','which','where','when','why','how','from','as','it','its','his','her','their','our','your','my','me','you','he','she','they','we','us','do','does','did','has','have','had','can','could','will','would','shall','should','may','might','must','not','so','if','then','than','also','such','no','yes','all','any','some','each','every','either','neither','both','few','many','much','more','most','other','another','own','same','just','even','still','yet','already','ever','never','always','sometimes','often','usually','again','once','twice','first','second','next','last','before','after','above','below','over','under','between','among','through','during','without','within','about','against','toward','upon','into','out','up','down','off','across','around','near','far','away','back','forth','together','apart','along','ahead','behind','beside','beyond','except','outside','inside','past','per','via','because','although','though','unless','until','while','whereas','whether','despite','regardless','concerning','regarding','according','including','excluding','following','preceding','due','thanks','via','versus','plus','minus','times','divided','amongst','amid','amidst','among','amongst','besides','despite','except','excluding','following','including','like','minus','near','off','onto','opposite','outside','over','past','per','plus','regarding','round','save','since','than','through','toward','towards','under','underneath','unlike','until','up','upon','versus','via','with','within','without'
]);

// Only replace if synonym is not the same as original, is a single word, and is not too rare
async function getSynonym(word) {
  const res = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=5`);
  const data = await res.json();
  // Filter out rare/strange synonyms
  const filtered = data.filter(d => d.word.toLowerCase() !== word.toLowerCase() && !d.word.includes(' ') && /^[a-zA-Z]+$/.test(d.word));
  // Pick the most common synonym if available
  if (filtered.length > 0) {
    return filtered[0].word;
  }
  return word;
}

const paraphraseService = {
  paraphrase: async (text) => {
    const words = text.split(/(\W+)/); // Split by non-word chars to preserve punctuation
    const paraphrasedWords = await Promise.all(words.map(async w => {
      // Only try to paraphrase alphabetic words that are not function words
      if (/^[a-zA-Z]+$/.test(w) && !skipWords.has(w.toLowerCase())) {
        return await getSynonym(w);
      }
      return w;
    }));
    return paraphrasedWords.join('');
  },
};

export default paraphraseService;
