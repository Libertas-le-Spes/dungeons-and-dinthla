import type { Source } from "../../kinds/source";
import type { ItemChangeKind } from "../../notes/reading/item-change";
import type { CoinEntry } from "../../notes/reading/ledger";
import type { Quest, QuestStatus } from "../../notes/reading/quest";

export type { QuestStatus, Source };

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
