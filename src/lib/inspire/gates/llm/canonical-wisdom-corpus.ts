export interface CanonicalSource {
  author: string;
  signaturePhrases: string[];
  paraphraseSignatures: string[];
}

export const CANONICAL_WISDOM: readonly CanonicalSource[] = [
  {
    author: "Viktor Frankl",
    signaturePhrases: [
      "between stimulus and response there is a space",
      "those who have a why can bear any how",
    ],
    paraphraseSignatures: [
      "there's a space between",
      "the space where you choose",
      "what is this asking of me",
      "find meaning in suffering",
    ],
  },
  {
    author: "Eckhart Tolle",
    signaturePhrases: [
      "the power of now",
      "present-moment awareness",
      "you are not your thoughts",
    ],
    paraphraseSignatures: [
      "fully present in this moment",
      "the only moment that exists",
      "watching your thoughts",
      "the voice in your head",
    ],
  },
  {
    author: "Brené Brown",
    signaturePhrases: [
      "vulnerability is strength",
      "the arena",
      "wholehearted",
      "daring greatly",
    ],
    paraphraseSignatures: [
      "showing up without armor",
      "the courage to be seen",
      "stepping into the arena",
      "vulnerability as courage",
    ],
  },
  {
    author: "David Goggins",
    signaturePhrases: [
      "callus the mind",
      "stay hard",
      "the 40% rule",
    ],
    paraphraseSignatures: [
      "you have more in the tank",
      "your mind quits before your body",
      "embrace the suck",
      "build mental calluses",
    ],
  },
  {
    author: "Ryan Holiday / Stoics",
    signaturePhrases: [
      "the obstacle is the way",
      "ego is the enemy",
      "memento mori",
      "amor fati",
    ],
    paraphraseSignatures: [
      "the obstacle becomes the path",
      "love your fate",
      "what stands in the way becomes the way",
      "remember you will die",
    ],
  },
  {
    author: "Marcus Aurelius / Stoics",
    signaturePhrases: [
      "control what you can control",
      "the dichotomy of control",
    ],
    paraphraseSignatures: [
      "focus only on what you can control",
      "let go of what you cannot change",
      "separate what depends on you",
      "within your power or outside it",
    ],
  },
  {
    author: "Buddhism (rehashed)",
    signaturePhrases: [
      "non-attachment",
      "the second arrow",
      "impermanence",
    ],
    paraphraseSignatures: [
      "the pain is the first arrow, your reaction is the second",
      "clinging causes suffering",
      "nothing is permanent",
      "let go of attachment",
    ],
  },
  {
    author: "Joseph Campbell",
    signaturePhrases: [
      "the hero's journey",
      "follow your bliss",
    ],
    paraphraseSignatures: [
      "answering the call",
      "crossing the threshold",
      "the road of trials",
      "returning with the elixir",
    ],
  },
  {
    author: "Carol Dweck",
    signaturePhrases: [
      "growth mindset",
      "fixed mindset",
    ],
    paraphraseSignatures: [
      "believing you can improve",
      "talent is not fixed",
      "the power of yet",
      "effort over innate ability",
    ],
  },
  {
    author: "Angela Duckworth",
    signaturePhrases: [
      "grit",
      "passion and perseverance",
    ],
    paraphraseSignatures: [
      "long-term persistence",
      "sustained effort over years",
      "consistency beats talent",
    ],
  },
  {
    author: "James Clear",
    signaturePhrases: [
      "atomic habits",
      "1% better every day",
      "systems over goals",
    ],
    paraphraseSignatures: [
      "tiny improvements compound",
      "identity-based change",
      "the aggregation of marginal gains",
      "focus on the system not the goal",
    ],
  },
  {
    author: "Jordan Peterson",
    signaturePhrases: [
      "clean your room",
      "stand up straight",
    ],
    paraphraseSignatures: [
      "put your house in order",
      "start with what you can control at home",
      "sort yourself out first",
    ],
  },
] as const;
