import type { Source } from "../kinds/source";
import type { ItemChangeKind } from "../notes/item-change";
import type { CoinEntry } from "../notes/ledger";

export type { Source };

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

export interface Thread<Closing extends SourcedText> extends SourcedText {
  notes: SourcedText[];
  closing: Closing | null;
}

export type QuestionRecord = Thread<SourcedText>;

export type QuestStatus = "completed" | "failed";

export interface QuestOutcome extends SourcedText {
  status: QuestStatus;
}

export interface QuestRecord extends Thread<QuestOutcome> {
  givenBy?: string;
  reward?: string;
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
