import type { Source } from "../../campaign/record/campaign";

export type OpenRow = (source: Source, onClosed: (changed: boolean) => void) => void;

export interface ThreadRowOpeners {
  openQuestion: OpenRow;
  openQuest: OpenRow;
}

export interface ThreadOpeners extends ThreadRowOpeners {
  showQuestions(): void;
  showQuests(): void;
}
