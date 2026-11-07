import type { ItemChangeKind } from "../notes/item-change";
import type { CoinEntry } from "../notes/ledger";
import type { Quest } from "../notes/quest";

export interface Source {
  path: string;
  line: number;
}

export interface SessionNote {
  path: string;
  number: number;
  text: string;
  firstLine: number;
}

export interface NoteLine {
  text: string;
  source: Source;
}

export interface QuestionRecord {
  text: string;
  source: Source;
  clues: NoteLine[];
  answer: NoteLine | null;
}

export type QuestStatus = "completed" | "failed";

export interface QuestOutcome extends NoteLine {
  status: QuestStatus;
}

export interface QuestRecord {
  quest: Quest;
  source: Source;
  progress: NoteLine[];
  outcome: QuestOutcome | null;
}

export interface CoinRecord {
  entry: CoinEntry;
  source: Source;
}

export type ItemEventKind = "named" | ItemChangeKind;

export interface ItemEvent {
  kind: ItemEventKind;
  holder: string;
  source: Source;
}

export interface ItemRecord {
  name: string;
  holder: string;
  source: Source;
  history: ItemEvent[];
  gone: ItemEvent | null;
}

export interface Campaign {
  questions: QuestionRecord[];
  quests: QuestRecord[];
  coins: CoinRecord[];
  items: ItemRecord[];
  purse: number;
  unmatched: NoteLine[];
}
