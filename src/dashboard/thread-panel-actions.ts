import type { Source } from "../campaign/campaign";

export interface ThreadPanelActions {
  openQuestion(source: Source, onClosed: (changed: boolean) => void): void;
  openQuest(source: Source, onClosed: (changed: boolean) => void): void;
  showQuestions(): void;
  showQuests(): void;
}
