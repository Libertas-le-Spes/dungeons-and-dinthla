export interface Quest {
  title: string;
  givenBy?: string;
  reward?: string;
}

const PART_BETWEEN_COMMAS = /(?:\[\[[^[\]]*\]\]|\d,(?=\d)|[^,])+/g;
const FACT = /\b(from|reward):(.*)$/;

function recordFact(quest: Quest, name: string, value: string): void {
  if (value === "") return;
  if (name === "from") quest.givenBy = value;
  if (name === "reward") quest.reward = value;
}

export function readQuest(body: string): Quest {
  const quest: Quest = { title: "" };
  const titleParts: string[] = [];
  for (const [part] of body.matchAll(PART_BETWEEN_COMMAS)) {
    const fact = FACT.exec(part);
    if (fact === null) {
      titleParts.push(part);
      continue;
    }
    titleParts.push(part.slice(0, fact.index));
    recordFact(quest, fact[1]!, fact[2]!.trim());
  }
  quest.title = titleParts
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join(", ");
  return quest;
}
