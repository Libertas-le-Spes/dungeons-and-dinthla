import type { OpenRow } from "../lists/list-page";

export interface ThreadRowOpeners {
  openQuestion: OpenRow;
  openQuest: OpenRow;
}

export interface ThreadOpeners extends ThreadRowOpeners {
  showQuestions(): void;
  showQuests(): void;
}
