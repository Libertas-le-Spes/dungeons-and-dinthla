import type { SessionChoice } from "./session-choices";

export interface PickerMoves {
  showSession(path: string): void;
  startSession(): void;
}

export class SessionPicker {
  private readonly title: HTMLElement;
  private readonly select: HTMLSelectElement;

  constructor(parent: HTMLElement, moves: PickerMoves) {
    const head = parent.createDiv({ cls: "dd-head dd-notes-head" });
    this.title = head.createEl("h2", { cls: "dd-title dd-notes-title" });
    this.select = head.createEl("select", { cls: "dropdown dd-notes-select", attr: { "aria-label": "Session" } });
    this.select.addEventListener("change", () => moves.showSession(this.select.value));
    const start = head.createEl("button", { cls: "dd-create", text: "New session" });
    start.addEventListener("click", () => moves.startSession());
  }

  show(heading: string, choices: SessionChoice[], shownPath: string | null): void {
    this.title.setText(heading);
    this.select.empty();
    for (const choice of choices) this.select.createEl("option", { text: choice.label, attr: { value: choice.path } });
    this.select.toggle(choices.length > 0);
    if (shownPath !== null) this.select.value = shownPath;
  }
}
