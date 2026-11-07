import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../campaign/campaign-store";
import { addQuestionRow, type QuestionActions } from "./question-row";
import { keywordsOf, listQuestions, type QuestionList } from "./question-list";

export const QUESTIONS_VIEW = "dungeons-and-dinthla-questions";

export class QuestionsView extends ItemView {
  private filter!: HTMLInputElement;
  private openCount!: HTMLElement;
  private openList!: HTMLElement;
  private answeredCount!: HTMLElement;
  private answeredList!: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly actions: QuestionActions,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return QUESTIONS_VIEW;
  }

  getDisplayText(): string {
    return "Questions";
  }

  override getIcon(): string {
    return "circle-help";
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-questions");
    const head = root.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Open questions" });
    this.openCount = title.createSpan({ cls: "dd-count" });
    this.filter = head.createEl("input", {
      cls: "dd-filter",
      type: "search",
      placeholder: "Filter by keywords",
      attr: { "aria-label": "Filter questions" },
    });
    this.registerDomEvent(this.filter, "input", () => this.render());
    this.openList = root.createEl("ul", { cls: "dd-list" });
    const answered = root.createEl("details", { cls: "dd-answered" });
    const summary = answered.createEl("summary", { text: "Answered" });
    this.answeredCount = summary.createSpan({ cls: "dd-count" });
    this.answeredList = answered.createEl("ul", { cls: "dd-list" });
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.render();
  }

  override async onClose(): Promise<void> {
    if (this.unsubscribe !== null) this.unsubscribe();
    this.unsubscribe = null;
  }

  private render(): void {
    const keywords = keywordsOf(this.filter.value);
    const list = listQuestions(this.store.current, keywords);
    this.showCounts(list);
    this.fill(this.openList, list.open, keywords, this.openEmptyText(list));
    this.fill(this.answeredList, list.answered, keywords, this.answeredEmptyText(list));
  }

  private showCounts(list: QuestionList): void {
    this.openCount.setText("");
    if (list.openCount > 0) this.openCount.setText(`${list.openCount} open`);
    this.answeredCount.setText(String(list.answeredCount));
  }

  private fill(list: HTMLElement, questions: QuestionList["open"], keywords: string[], emptyText: string): void {
    list.empty();
    if (questions.length === 0) {
      list.createEl("li", { cls: "dd-empty", text: emptyText });
      return;
    }
    for (const question of questions) addQuestionRow(list, question, keywords, this.actions);
  }

  private openEmptyText(list: QuestionList): string {
    if (list.openCount === 0) return "No open questions. Start a note with ? to ask one.";
    return `No open question matches “${this.filter.value.trim()}”.`;
  }

  private answeredEmptyText(list: QuestionList): string {
    if (list.answeredCount === 0) return "Nothing answered yet.";
    return `No answered question matches “${this.filter.value.trim()}”.`;
  }
}
