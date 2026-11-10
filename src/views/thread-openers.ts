import type { OpenRow } from "./list-page";

export interface ThreadOpeners {
  openQuestion: OpenRow;
  openQuest: OpenRow;
  showQuestions(): void;
  showQuests(): void;
}
