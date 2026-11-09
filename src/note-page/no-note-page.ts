import { Component } from "obsidian";

export const NO_NOTE = "Open a note of the campaign to see it here.";

export class NoNotePage extends Component {
  constructor(private readonly contentEl: HTMLElement) {
    super();
  }

  override onload(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-note-page");
    root.createEl("p", { cls: "dd-empty", text: NO_NOTE });
  }
}
