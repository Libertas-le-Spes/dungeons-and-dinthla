import { Component } from "obsidian";
import { campaignOfReference } from "../campaign/paths/campaign-folders";
import { noteNameOf } from "../campaign/paths/note-name";
import { MentionsPanel } from "../characters/pages/mentions-panel";
import type { MentionNotes } from "../characters/reading/mention-notes";
import { placeReferenceKind } from "../kinds/place-reference-kind";
import type { LinkActions } from "../views/lists/linked-text";
import { LeftCampaign } from "./left-campaign";
import { NoteEditing, type NoteEditingNeeds } from "../note-editing/note-editing";
import { NoteLinks } from "./note-links";

export interface NotePageNeeds extends NoteEditingNeeds {
  actions: LinkActions;
  mentionNotes: MentionNotes;
  isCampaignNote(path: string): boolean;
  openInEditor(path: string): void;
}

export class NotePage extends Component {
  private links!: NoteLinks;
  private editing: NoteEditing | null = null;
  private left: LeftCampaign | null = null;
  private mentions: MentionsPanel | null = null;

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
    this.showMentions(root);
  }

  async mentionsSettled(): Promise<void> {
    if (this.mentions !== null) await this.mentions.readSettled();
  }

  async editingSettled(): Promise<void> {
    if (this.editing !== null) await this.editing.settled();
  }

  textShown(text: string, unsaved: boolean): void {
    if (this.left !== null) this.left.setUnsaved(unsaved);
    this.links.show(text);
  }

  private showMentions(root: HTMLElement): void {
    const notes = this.needs.mentionNotes;
    if (campaignOfReference(placeReferenceKind, this.path, notes.campaignFolders()) === null) return;
    const file = notes.fileAt(this.path);
    if (file === null) return;
    const mentions = new MentionsPanel(notes, this.needs.actions);
    this.mentions = mentions;
    this.register(mentions.watch());
    this.register(() => mentions.clear());
    mentions.draw(root.createEl("section", { cls: "dd-note-mentions" }), file);
  }

  private sayIfLeftCampaign(root: HTMLElement): void {
    if (this.needs.isCampaignNote(this.path)) return;
    this.left = new LeftCampaign(root, () => this.needs.openInEditor(this.path));
  }
}
