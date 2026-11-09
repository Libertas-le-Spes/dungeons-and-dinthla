import type { Campaign } from "../campaign/campaign";
import type { NoteEditingNeeds } from "../note-page/note-editing";
import type { LinkActions } from "../views/linked-text";
import { EditAllPanel } from "./edit-all-panel";
import { LinesList } from "./lines-list";
import { NotesButtons } from "./notes-buttons";
import { WritingPanel, type WritingNeeds } from "./writing-panel";
import type { WrittenLine } from "./written-lines";

export interface SessionWritingNeeds extends WritingNeeds {
  actions: LinkActions;
  wholeText: NoteEditingNeeds;
}

export class SessionWriting {
  private readonly writing: WritingPanel;
  private readonly lines: LinesList;
  private readonly buttons: NotesButtons;
  private readonly editAll: EditAllPanel;
  private readonly stopListening: () => void;

  constructor(
    root: HTMLElement,
    private readonly path: string,
    private readonly needs: SessionWritingNeeds,
  ) {
    this.writing = new WritingPanel(root, path, needs);
    this.lines = new LinesList(root, needs.actions);
    this.buttons = new NotesButtons(this.lines.head, { editAll: () => this.openEditAll() });
    this.editAll = new EditAllPanel(root, path, needs.wholeText, () => this.editAllLeft());
    this.stopListening = needs.wholeText.drafts.subscribe((changed) => this.wholeTextKept(changed));
    this.wholeTextKept(path);
  }

  focus(): void {
    this.writing.focus();
  }

  close(): void {
    this.stopListening();
    this.editAll.close();
    this.writing.close();
  }

  show(lines: WrittenLine[], campaign: Campaign): void {
    this.lines.show(lines, campaign);
  }

  setGone(gone: boolean): void {
    this.writing.setGone(gone);
  }

  private openEditAll(): void {
    this.writing.setShown(false);
    this.lines.setShown(false);
    this.editAll.open();
  }

  private editAllLeft(): void {
    this.writing.setShown(true);
    this.lines.setShown(true);
    this.writing.focus();
  }

  private wholeTextKept(path: string): void {
    if (path !== this.path) return;
    this.buttons.setEditsNotSaved(this.needs.wholeText.drafts.draftOf(path) !== null);
  }
}
