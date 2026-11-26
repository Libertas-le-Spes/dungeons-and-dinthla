import { campaignOfReference } from "../campaign/paths/campaign-folders";
import { MentionsPanel, type MentionActions } from "../characters/pages/mentions-panel";
import type { MentionNotes } from "../characters/reading/mention-notes";
import { placeReferenceKind } from "../kinds/place-reference-kind";
import { LeftCampaign } from "./left-campaign";
import { NoteEditing, type NoteEditingNeeds } from "../note-editing/note-editing";
import { NoteLinks } from "./note-links";
import { noteTitleOf } from "./note-title";
import type { Pauses } from "../host/keeping/pauses";
import type { NoteRef } from "../host/notes/note-ref";
import { HandleRequest } from "../views/elements/bindings/bindings";
import { KeptHandle } from "../views/elements/bindings/kept-handle";
import { Heading2, Section } from "../views/elements/kinds/containers";
import type { ViewElement } from "../views/elements/view-element";
import type { PageView, ShownPage } from "../views/pages/page-view";

export interface NotePageNeeds extends NoteEditingNeeds {
  actions: MentionActions;
  mentionNotes: MentionNotes;
  pauses: Pauses;
  isCampaignNote(path: string): boolean;
  openInEditor(path: string): void;
}

const PAGE_CLASSES = ["dd-root", "dd-list-view", "dd-session-notes", "dd-note-page"];

export class NotePage implements ShownPage {
  readonly cls = PAGE_CLASSES;
  private readonly links: NoteLinks;
  private readonly editing: NoteEditing;
  private readonly left: LeftCampaign | null = null;
  private mentions: MentionsPanel | null = null;
  private readonly stops: (() => void)[] = [];

  constructor(
    private readonly path: string,
    private readonly needs: NotePageNeeds,
  ) {
    this.links = new NoteLinks(path, needs.actions);
    this.editing = new NoteEditing(path, needs, this);
    if (!needs.isCampaignNote(path)) this.left = new LeftCampaign(this.openInEditor.bind(this));
  }

  opened(view: PageView): void {
    const trees: ViewElement[] = [new Heading2({ cls: ["dd-title", "dd-note-title"], text: noteTitleOf(this.path, this.needs.mentionNotes.campaignFolders()) })];
    if (this.left !== null) trees.push(this.left.tree());
    trees.push(new Section({ cls: ["dd-notes-panel", "dd-note-panel"] }, this.editing.trees()), this.links.tree());
    const file = this.mentionedFile();
    const place = new KeptHandle();
    if (file !== null) trees.push(new Section({ cls: ["dd-note-mentions"], bindings: [new HandleRequest(place)] }));
    view.show(trees);
    if (this.left !== null) this.left.setUnsaved(true);
    this.links.show("");
    this.editing.start();
    if (file !== null) this.showMentions(place, file);
  }

  closed(): void {
    this.editing.close();
    for (const stop of this.stops) stop();
    this.stops.length = 0;
  }

  async mentionsSettled(): Promise<void> {
    if (this.mentions !== null) await this.mentions.readSettled();
  }

  async editingSettled(): Promise<void> {
    await this.editing.settled();
  }

  textShown(text: string, unsaved: boolean): void {
    if (this.left !== null) this.left.setUnsaved(unsaved);
    this.links.show(text);
  }

  private openInEditor(): void {
    this.needs.openInEditor(this.path);
  }

  private mentionedFile(): NoteRef | null {
    const notes = this.needs.mentionNotes;
    if (campaignOfReference(placeReferenceKind, this.path, notes.campaignFolders()) === null) return null;
    return notes.fileAt(this.path);
  }

  private showMentions(place: KeptHandle, file: NoteRef): void {
    const mentions = new MentionsPanel(this.needs.mentionNotes, this.needs.actions, this.needs.pauses);
    this.mentions = mentions;
    this.stops.push(mentions.watch(), mentions.clear.bind(mentions));
    mentions.draw(place, file);
  }
}
