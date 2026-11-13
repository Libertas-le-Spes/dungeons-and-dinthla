import { Component } from "obsidian";
import { noteNameOf } from "../campaign/paths/note-name";
import type { LinkActions } from "../views/lists/linked-text";
import { LeftCampaign } from "./left-campaign";
import { NoteEditing, type NoteEditingNeeds } from "../note-editing/note-editing";
import { NoteLinks } from "./note-links";

export interface NotePageNeeds extends NoteEditingNeeds {
  actions: LinkActions;
  isCampaignNote(path: string): boolean;
  openInEditor(path: string): void;
}

export class NotePage extends Component {
  private links!: NoteLinks;
  private editing: NoteEditing | null = null;
  private left: LeftCampaign | null = null;

  constructor(
    private readonly contentEl: HTMLElement,
    private readonly path: string,
    private readonly needs: NotePageNeeds,
  ) {
    super();
  }

  override onload(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view", "dd-session-notes", "dd-note-page");
    root.createEl("h2", { cls: "dd-title dd-note-title", text: noteNameOf(this.path) });
    this.sayIfLeftCampaign(root);
    const panel = root.createEl("section", { cls: "dd-notes-panel dd-note-panel" });
    this.links = new NoteLinks(root, this.path, this.needs.actions);
    this.links.show("");
    const editing = new NoteEditing(panel, this.path, this.needs, this);
    this.editing = editing;
    this.register(() => editing.close());
  }

  async editingSettled(): Promise<void> {
    if (this.editing !== null) await this.editing.settled();
  }

  textShown(text: string, unsaved: boolean): void {
    if (this.left !== null) this.left.setUnsaved(unsaved);
    this.links.show(text);
  }

  private sayIfLeftCampaign(root: HTMLElement): void {
    if (this.needs.isCampaignNote(this.path)) return;
    this.left = new LeftCampaign(root, () => this.needs.openInEditor(this.path));
  }
}
