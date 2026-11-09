import type { NoteTexts } from "../campaign/note-texts";
import { messageOf } from "../views/message-of";
import { NoteBox } from "./note-box";
import type { NoteDraft, NoteDrafts } from "./note-drafts";
import { NoteChangedSince, type NoteSaver } from "./note-saver";

export const NOTE_GONE_HERE = "This note was deleted, so nothing can be saved to it. What you typed is still in the box.";
export const CHANGED_ELSEWHERE =
  "The note was changed somewhere else since you started typing here. Saving won't overwrite that change: copy out what you typed, then load the note again to see it.";

export interface NoteEditingNeeds {
  texts: NoteTexts;
  drafts: NoteDrafts;
  saver: NoteSaver;
}

export interface EditingWatcher {
  textShown(text: string, unsaved: boolean): void;
}

function notSavedMessage(error: unknown): string {
  return `Couldn't save: ${messageOf(error)} What you typed is still in the box.`;
}

function notReadMessage(error: unknown): string {
  return `Couldn't read the note: ${messageOf(error)}`;
}

export class NoteEditing {
  private readonly box: NoteBox;
  private readonly stops: (() => void)[];
  private base: string | null = null;
  private open = true;

  constructor(
    parent: HTMLElement,
    private readonly path: string,
    private readonly needs: NoteEditingNeeds,
    private readonly watcher: EditingWatcher,
  ) {
    this.box = new NoteBox(parent, {
      save: () => void this.save(),
      typed: () => this.typed(),
      reload: () => void this.reload(),
    });
    this.stops = this.watch();
    void this.loadNote();
  }

  get unsaved(): boolean {
    if (this.base === null) return false;
    return this.box.text !== this.base;
  }

  focus(): void {
    this.box.focus();
  }

  close(): void {
    this.open = false;
    this.box.close();
    for (const stop of this.stops) stop();
  }

  private watch(): (() => void)[] {
    const texts = this.needs.texts;
    return [
      texts.onChanged((path, text) => this.ifShown(path, () => this.changedElsewhere(text))),
      texts.onGone((path) => this.ifShown(path, () => this.box.say(NOTE_GONE_HERE))),
      this.needs.drafts.subscribe((path) => this.ifShown(path, () => this.draftChanged())),
    ];
  }

  private ifShown(path: string, run: () => void): void {
    if (path === this.path) run();
  }

  private async loadNote(): Promise<void> {
    await this.readNote((text) => this.startWith(text));
  }

  private async readNote(then: (text: string | null) => void): Promise<void> {
    let text: string | null;
    try {
      text = await this.needs.texts.read(this.path);
    } catch (error) {
      this.box.say(notReadMessage(error));
      return;
    }
    if (this.open) then(text);
  }

  private startWith(text: string | null): void {
    const draft = this.needs.drafts.draftOf(this.path);
    if (draft !== null) {
      this.startFromDraft(draft, text);
      return;
    }
    if (text === null) {
      this.box.say(NOTE_GONE_HERE);
      return;
    }
    this.show(text, text);
  }

  private startFromDraft(draft: NoteDraft, text: string | null): void {
    this.show(draft.base, draft.text);
    if (text === null) this.box.say(NOTE_GONE_HERE);
    else if (text !== draft.base) this.changedSinceLoaded();
  }

  private show(base: string, text: string): void {
    this.base = base;
    this.box.text = text;
    this.box.setReady(true);
    this.savingChanged();
    this.textChanged();
  }

  private textChanged(): void {
    const unsaved = this.box.text !== this.base;
    this.box.setUnsaved(unsaved);
    this.watcher.textShown(this.box.text, unsaved);
  }

  private typed(): void {
    this.keepDraft();
    this.textChanged();
  }

  private keepDraft(): void {
    if (this.base === null) return;
    this.needs.drafts.keep(this.path, { base: this.base, text: this.box.text });
  }

  private draftChanged(): void {
    this.savingChanged();
    if (this.base === null || this.needs.drafts.isSaving(this.path)) return;
    const draft = this.needs.drafts.draftOf(this.path);
    if (draft === null || this.isShowing(draft)) return;
    this.base = draft.base;
    this.box.text = draft.text;
    this.textChanged();
  }

  private isShowing(draft: NoteDraft): boolean {
    return draft.base === this.base && draft.text === this.box.text;
  }

  private savingChanged(): void {
    this.box.setSaving(this.needs.drafts.isSaving(this.path));
  }

  private changedSinceLoaded(): void {
    this.box.say(CHANGED_ELSEWHERE);
    this.box.offerReload(true);
  }

  private changedElsewhere(text: string): void {
    const base = this.base;
    if (base === null || text === base) return;
    if (text === this.box.text) {
      this.base = text;
      this.keepDraft();
      this.textChanged();
      return;
    }
    if (this.box.text !== base) {
      this.changedSinceLoaded();
      return;
    }
    this.base = text;
    this.box.text = text;
    this.textChanged();
  }

  private async save(): Promise<void> {
    const drafts = this.needs.drafts;
    const base = this.base;
    if (base === null || drafts.isSaving(this.path) || this.box.text === base) return;
    const draft = { base, text: this.box.text };
    drafts.keep(this.path, draft);
    try {
      const saved = await drafts.save(this.path, (path, kept) => this.needs.saver.save(path, kept));
      if (saved) this.saved(draft.text);
    } catch (error) {
      this.notSaved(error);
    }
    this.textChanged();
    this.box.focus();
  }

  private saved(text: string): void {
    this.base = text;
    this.box.say("");
    this.box.offerReload(false);
  }

  private notSaved(error: unknown): void {
    if (error instanceof NoteChangedSince) {
      this.changedSinceLoaded();
      return;
    }
    this.box.say(notSavedMessage(error));
  }

  private async reload(): Promise<void> {
    await this.readNote((text) => this.reloaded(text));
  }

  private reloaded(text: string | null): void {
    if (text === null) {
      this.box.say(NOTE_GONE_HERE);
      return;
    }
    this.box.say("");
    this.box.offerReload(false);
    this.show(text, text);
    this.keepDraft();
  }
}
