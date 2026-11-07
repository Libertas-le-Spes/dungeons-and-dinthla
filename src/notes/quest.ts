export interface Quest {
  title: string;
  givenBy?: string;
  reward?: string;
}

const PART_BETWEEN_COMMAS = /(?:\[\[[^[\]]*\]\]|\d,(?=\d)|[^,])+/g;
const FACT_NAME = /\b(from|reward):/g;

function recordFact(quest: Quest, name: string, value: string): void {
  if (value === "") return;
  if (name === "from") quest.givenBy = value;
  if (name === "reward") quest.reward = value;
}

function readPart(quest: Quest, part: string): string {
  const facts = [...part.matchAll(FACT_NAME)];
  if (facts.length === 0) return part;
  facts.forEach((fact, position) => {
    const valueStart = fact.index + fact[0].length;
    const nextFact = facts[position + 1];
    const value = part.slice(valueStart, nextFact?.index);
    recordFact(quest, fact[1]!, value.trim());
  });
  return part.slice(0, facts[0]!.index);
}

export function readQuest(body: string): Quest {
  const quest: Quest = { title: "" };
  const titleParts: string[] = [];
  for (const [part] of body.matchAll(PART_BETWEEN_COMMAS)) {
    titleParts.push(readPart(quest, part));
  }
  quest.title = titleParts
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join(", ");
  return quest;
}
