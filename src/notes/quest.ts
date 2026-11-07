export interface Quest {
  title: string;
  givenBy?: string;
  reward?: string;
}

const FACT = /,?\s*\b(from|reward):\s*([^,]+)/g;

export function readQuest(body: string): Quest {
  const quest: Quest = { title: "" };
  quest.title = body
    .replace(FACT, (_fact, name: string, value: string) => {
      if (name === "from") quest.givenBy = value.trim();
      else quest.reward = value.trim();
      return "";
    })
    .trim();
  return quest;
}
