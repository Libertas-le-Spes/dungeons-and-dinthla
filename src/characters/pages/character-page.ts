import { Component } from "obsidian";
import type { NoteRef } from "../../host/notes/note-ref";

export const ALL_CHARACTERS = "← All characters";

export type MakeSheet = (contentEl: HTMLElement, file: NoteRef) => Component;

export class CharacterPage extends Component {
  constructor(
    private readonly contentEl: HTMLElement,
    private readonly file: NoteRef,
    private readonly makeSheet: MakeSheet,
    private readonly showGallery: () => void,
  ) {
    super();
  }

  override onload(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-character-page");
    const back = root.createEl("button", { cls: "dd-back", text: ALL_CHARACTERS });
    this.registerDomEvent(back, "click", () => this.showGallery());
    this.addChild(this.makeSheet(root.createDiv(), this.file));
  }
}
