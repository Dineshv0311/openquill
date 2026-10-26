// Contextual thesaurus matching QuillBot's api/paraphraser/paraphrase-thesaurus

export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  quick: ["fast", "rapid", "swift", "brisk", "speedy", "prompt"],
  important: ["crucial", "essential", "vital", "significant", "paramount", "critical"],
  make: ["create", "build", "produce", "generate", "construct", "formulate"],
  use: ["utilize", "apply", "employ", "leverage", "operate", "harness"],
  show: ["display", "exhibit", "demonstrate", "reveal", "indicate", "illustrate"],
  good: ["excellent", "superb", "exceptional", "favorable", "splendid", "positive"],
  bad: ["poor", "inferior", "substandard", "detrimental", "adverse", "flawed"],
  help: ["assist", "aid", "support", "facilitate", "guide", "bolster"],
  big: ["substantial", "immense", "extensive", "massive", "significant", "sizable"],
  small: ["minor", "modest", "compact", "diminutive", "slight", "subtle"],
  change: ["modify", "alter", "transform", "adjust", "revise", "convert"],
  improve: ["enhance", "boost", "elevate", "refine", "upgrade", "strengthen"],
  start: ["commence", "initiate", "embark", "launch", "begin", "originate"],
  finish: ["conclude", "complete", "finalize", "accomplish", "terminate", "wrap up"],
  idea: ["concept", "notion", "thought", "perspective", "approach", "hypothesis"],
  think: ["believe", "consider", "ponder", "regard", "evaluate", "reflect"],
  problem: ["challenge", "obstacle", "dilemma", "complication", "issue", "hurdle"],
  solution: ["resolution", "answer", "remedy", "countermeasure", "strategy"],
  many: ["numerous", "countless", "various", "multiple", "several", "abundant"],
  simple: ["straightforward", "elementary", "uncomplicated", "clear", "direct"],
  complex: ["intricate", "sophisticated", "elaborate", "involved", "convoluted"],
  find: ["discover", "uncover", "identify", "locate", "detect", "ascertain"],
  tell: ["inform", "notify", "communicate", "convey", "disclose", "relay"],
  look: ["observe", "inspect", "examine", "scrutinize", "view", "survey"],
  understand: ["comprehend", "grasp", "fathom", "discern", "perceive"],
  great: ["remarkable", "outstanding", "impressive", "extraordinary", "phenomenal"],
  smart: ["intelligent", "astute", "shrewd", "clever", "sharp", "ingenious"],
  easy: ["effortless", "manageable", "painless", "seamless", "accessible"],
  hard: ["challenging", "demanding", "rigorous", "arduous", "strenuous"],
  clear: ["evident", "lucid", "apparent", "transparent", "unambiguous", "distinct"],
  need: ["require", "demand", "necessitate", "warrant", "entail"],
  write: ["compose", "draft", "author", "formulate", "pen", "inscribe"],
  learn: ["acquire", "master", "absorb", "assimilate", "study"],
  teach: ["instruct", "educate", "train", "tutor", "enlighten"],
  feature: ["capability", "functionality", "characteristic", "attribute", "aspect"],
  product: ["offering", "solution", "commodity", "application", "platform"],
  engineer: ["developer", "architect", "designer", "creator", "specialist"],
  reverse: ["deconstruct", "dissect", "invert", "backtrack", "counteract"],
  system: ["framework", "infrastructure", "architecture", "mechanism", "network"],
  fast: ["rapid", "swift", "speedy", "brisk", "expeditious", "quick"],
  powerful: ["potent", "robust", "formidable", "commanding", "influential"],
  provide: ["supply", "furnish", "deliver", "yield", "grant", "offer"],
  different: ["distinct", "diverse", "disparate", "divergent", "contrasting"],
  often: ["frequently", "repeatedly", "regularly", "commonly", "habitually"],
  always: ["consistently", "invariably", "perpetually", "continually", "without exception"],
  never: ["under no circumstances", "at no point", "not once", "by no means"],
  because: ["since", "owing to", "given that", "as a result of", "due to"],
  however: ["nevertheless", "nonetheless", "conversely", "on the other hand", "yet"],
  therefore: ["consequently", "accordingly", "hence", "as a result", "thus"],
  furthermore: ["moreover", "in addition", "additionally", "what is more"],
  although: ["even though", "despite the fact that", "while", "whereas"],
};

// Build inverted reverse lookup map so synonyms can find their sibling alternatives
const REVERSE_LOOKUP: Record<string, Set<string>> = {};

Object.entries(SYNONYM_DICTIONARY).forEach(([root, alts]) => {
  const group = [root, ...alts];
  group.forEach((w) => {
    if (!REVERSE_LOOKUP[w]) REVERSE_LOOKUP[w] = new Set();
    group.forEach((other) => {
      if (other !== w) REVERSE_LOOKUP[w].add(other);
    });
  });
});

export function getSynonymsForWord(rawWord: string): string[] {
  const clean = rawWord.toLowerCase().replace(/[^a-z]/g, "");
  if (REVERSE_LOOKUP[clean]) {
    const isCapitalized = /^[A-Z]/.test(rawWord);
    return Array.from(REVERSE_LOOKUP[clean]).map((syn) =>
      isCapitalized ? syn.charAt(0).toUpperCase() + syn.slice(1) : syn
    );
  }
  return [];
}
