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

export interface SourcedText {
  text: string;
  source: Source;
}

export interface QuestionRecord {
  text: string;
  source: Source;
  clues: SourcedText[];
  answer: SourcedText | null;
}

export type QuestStatus = "completed" | "failed";

export interface QuestOutcome extends SourcedText {
  status: QuestStatus;
}

export interface QuestRecord {
  quest: Quest;
  source: Source;
  progress: SourcedText[];
  outcome: QuestOutcome | null;
}

export interface CoinRecord {
  entry: CoinEntry;
  text: string;
  source: Source;
  isSale: boolean;
}

export type ItemEventKind = "named" | ItemChangeKind;

export interface ItemEvent {
  kind: ItemEventKind;
  holder: string;
  source: Source;
}

export interface ItemRecord {
  name: string;
  written: string;
  holder: string;
  holderLinked: boolean;
  source: Source;
  history: ItemEvent[];
  gone: ItemEvent | null;
}

export interface Campaign {
  questions: QuestionRecord[];
  quests: QuestRecord[];
  coins: CoinRecord[];
  items: ItemRecord[];
  purseCopper: number;
  unmatched: SourcedText[];
}
