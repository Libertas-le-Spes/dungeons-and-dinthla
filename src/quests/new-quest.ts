import type { QuestRecord } from "../campaign/campaign";
import { readMarker } from "../notes/marker";
import { readQuest } from "../notes/quest";
import { newQuestLine, questTextOf } from "../notes/quest-lines";
import { oneLine } from "../notes/question-lines";

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

function giverLink(givenBy: string, characters: string[]): string {
  const name = oneLine(givenBy);
  if (name === "" || name.startsWith("[[")) return name;
  const known = characters.find((character) => character.toLowerCase() === name.toLowerCase());
  if (known === undefined) return name;
  return `[[${known}]]`;
}

export function planNewQuest(entry: NewQuest, characters: string[]): NewQuestPlan {
  const title = questTextOf(entry.title);
  const givenBy = giverLink(entry.givenBy, characters);
  const reward = oneLine(entry.reward);
  return { title, givenBy, reward, line: newQuestLine(title, givenBy, reward) };
}

function factOf(fact: string | undefined): string {
  if (fact === undefined) return "";
  return fact;
}

export function refusalForNewQuest(quests: QuestRecord[], plan: NewQuestPlan): string | null {
  if (quests.some((record) => record.quest.title === plan.title)) return SAME_TITLE_AS_EXISTING;
  const read = readQuest(readMarker(plan.line).body);
  const readsBack = read.title === plan.title && factOf(read.givenBy) === plan.givenBy && factOf(read.reward) === plan.reward;
  if (!readsBack) return WOULD_READ_DIFFERENTLY;
  return null;
}
