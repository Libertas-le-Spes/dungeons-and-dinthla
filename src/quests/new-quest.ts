import type { QuestRecord } from "../campaign/campaign";
import { readMarker } from "../notes/marker";
import { readQuest } from "../notes/quest";
import { newQuestLine, questTextOf } from "../notes/quest-lines";
import type { Character } from "../campaign/characters";
import { oneLine } from "../notes/thread-lines";

export interface NewQuest {
  title: string;
  givenBy: string;
  reward: string;
}

export interface NewQuestPlan extends NewQuest {
  line: string;
}

export const SAME_TITLE_AS_EXISTING = "A quest already has that title, so changes would be mixed up between them. Reword this one.";
export const WOULD_READ_DIFFERENTLY =
  "That quest would be read back differently from what was typed, perhaps because of a comma or a from: or reward: in it. Reword it.";

function writtenGiver(givenBy: string, characters: Character[]): string {
  const name = oneLine(givenBy);
  const known = characters.find((character) => character.name.toLowerCase() === name.toLowerCase());
  if (known === undefined) return name;
  if (known.linktext === known.name) return `[[${known.name}]]`;
  return `[[${known.linktext}|${known.name}]]`;
}

export function planNewQuest(entry: NewQuest, characters: Character[]): NewQuestPlan {
  const title = questTextOf(entry.title);
  const givenBy = writtenGiver(entry.givenBy, characters);
  const reward = oneLine(entry.reward);
  return { title, givenBy, reward, line: newQuestLine(title, givenBy, reward) };
}

function factOf(fact: string | undefined): string {
  if (fact === undefined) return "";
  return fact;
}

export function refusalForNewQuest(quests: QuestRecord[], plan: NewQuestPlan): string | null {
  if (quests.some((record) => record.text === plan.title)) return SAME_TITLE_AS_EXISTING;
  const read = readQuest(readMarker(plan.line).body);
  const readsBack = read.title === plan.title && factOf(read.givenBy) === plan.givenBy && factOf(read.reward) === plan.reward;
  if (!readsBack) return WOULD_READ_DIFFERENTLY;
  return null;
}
