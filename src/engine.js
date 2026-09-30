export const rounds = [
  {
    id: "brain",
    category: "Common knowledge",
    claim: "Humans only use 10% of their brains.",
    answer: false,
    initial: { answer: false, confidence: 94 },
    finalConfidence: 98,
    cost: 0,
    source: "BrainFacts · Society for Neuroscience",
    url: "https://www.brainfacts.org/thinking-sensing-and-behaving/thinking-and-awareness/2019/debunked-the-10-percent-brain-myth-061719",
    evidence:
      "Neuroscientist Nick Spitzer explains that we use all of our brain. The idea that 90% sits unused is a myth; this does not mean every neuron fires at once.",
    lesson: "A familiar claim is not necessarily a reliable one.",
  },
  {
    id: "venus",
    category: "Science & surprises",
    claim: "Venus takes longer to rotate once than to orbit the Sun.",
    answer: true,
    initial: { answer: false, confidence: 62 },
    finalConfidence: 98,
    cost: 2,
    source: "NASA · Venus facts",
    url: "https://science.nasa.gov/venus/venus-facts/",
    evidence:
      "Venus takes about 243 Earth days to rotate once, but only about 225 Earth days to orbit the Sun. This refers to a full rotation, not sunrise to sunrise.",
    lesson:
      "Precise wording matters. A rotation and a solar day are different things.",
  },
  {
    id: "clock",
    category: "The evidence test",
    claim:
      "Near Earth’s surface, a clock raised 33 cm can tick faster than an identical lower clock.",
    answer: true,
    initial: { answer: false, confidence: 53 },
    finalConfidence: 97,
    cost: 3,
    source: "NIST · Atomic clock experiment",
    url: "https://www.nist.gov/news-events/news/2010/09/nist-clock-experiment-demonstrates-your-head-older-your-feet",
    evidence:
      "NIST compared two ultra-precise atomic clocks with a 33-centimeter height difference. The higher clock ran slightly faster, as gravitational time dilation predicts. The difference is far too small to notice with an ordinary clock.",
    lesson:
      "Counterintuitive does not mean false. Measured evidence can change your mind.",
  },
];
export const money = (cents) => (cents / 100).toFixed(2);
export const factNotes = {
  brain: {
    type: "Neuroscience explainer",
    checked: "2026-09-30",
    nuance:
      "Using the whole brain over time does not mean all neurons fire simultaneously.",
    quip: "Your brain is not on a 10% free trial.",
  },
  venus: {
    type: "NASA planetary reference",
    checked: "2026-09-30",
    nuance:
      "One rotation (a sidereal day) is not a sunrise-to-sunrise solar day.",
    quip: "Venus really takes its time getting out of bed.",
  },
  clock: {
    type: "NIST experimental report",
    checked: "2026-09-30",
    nuance:
      "This compares stationary clocks at different heights near Earth, with other effects controlled.",
    quip: "Even time has a tiny upstairs surcharge.",
  },
};
// This policy never receives the human answer or the ground truth.
export function decide(initial, offer, balance) {
  if (
    !initial ||
    typeof initial.answer !== "boolean" ||
    !Number.isFinite(initial.confidence) ||
    initial.confidence < 50 ||
    initial.confidence > 100 ||
    !offer ||
    !Number.isSafeInteger(offer.cost) ||
    offer.cost < 0 ||
    !Number.isSafeInteger(balance) ||
    balance < 0
  )
    throw new Error("Invalid decision inputs");
  return initial.confidence < 80 && offer.cost > 0 && offer.cost <= balance
    ? {
        buy: true,
        reason: `${initial.confidence}% confidence is below my 80% threshold. This demo evidence service costs ${money(offer.cost)} USDC and fits my remaining budget.`,
      }
    : {
        buy: false,
        reason:
          initial.confidence >= 80
            ? "I know this one. My two cents are staying in my wallet."
            : "This evidence is outside my remaining budget. I’ll keep my initial answer.",
      };
}
export function summarize(results) {
  const human = results.filter((r) => r.humanCorrect).length,
    agent = results.filter((r) => r.agentCorrect).length;
  const spend = results.reduce((s, r) => s + r.cost, 0);
  const gained = results.reduce(
    (sum, r) => sum + Number(r.agentCorrect) - Number(r.initialCorrect),
    0,
  );
  return {
    human,
    agent,
    spend,
    gained,
    roi: spend ? gained / (spend / 100) : null,
  };
}
