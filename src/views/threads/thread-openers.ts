import type { OpenRow } from "../lists/list-page";

export interface ThreadOpeners {
  openQuestion: OpenRow;
  openQuest: OpenRow;
  showQuestions(): void;
  showQuests(): void;
}
