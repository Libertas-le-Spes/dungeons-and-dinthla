import type { TFile } from "obsidian";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { MakeResult } from "../../note-keeping/make-result";
import type { MakerActions, MakerFiles } from "../../note-keeping/new-note-maker";
import { PathQueue } from "../../note-keeping/path-queue";
import { SaidOnce } from "../../note-keeping/said-once";
import { messageOf } from "../../views/dialogs/message-of";
import { kindNoteTitleOf } from "../wanting/kind-note-path";
import { canMake, wantedKeyOf, type MakeableNote, type WantedNote } from "../wanting/wanted-note";
import { readExistingNote, isOutOfStep, type ExistingMetadata } from "./existing-note";
import { KindNoteWriter } from "./kind-note-writer";
import { NoteMemos } from "./note-memos";
import { sessionLinkFor } from "./session-link";

export interface KindNoteKeeperNeeds {
  files: MakerFiles & Pick<FencedFiles, "getFileByPath">;
  metadata: ExistingMetadata;
  actions: MakerActions;
  say(message: string): void;
}

export function notLinkedMessage(wanted: WantedNote): string {
  return `${wanted.path} already exists but isn't linked to its session in its properties, so it was left alone.`;
}

export function failedMessage(wanted: WantedNote, error: unknown): string {
  return `Couldn't write ${kindNoteTitleOf(wanted.folder, wanted.sessionPath)}: ${messageOf(error)}`;
}

export class KindNoteKeeper {
  private readonly memos = new NoteMemos();
  private readonly queue = new PathQueue();
  private readonly said: SaidOnce;
  private readonly writer: KindNoteWriter;

  constructor(private readonly needs: KindNoteKeeperNeeds) {
    this.said = new SaidOnce(needs.say);
    this.writer = new KindNoteWriter(needs.files, needs.actions);
  }

  keep(notes: WantedNote[]): void {
    for (const note of notes) {
      this.memos.want(note);
      void this.queue.run(note.path, () => this.settle(note.path));
    }
  }

  async makeIfMissing(note: WantedNote): Promise<MakeResult> {
    let result: MakeResult = "left";
    await this.queue.run(note.path, async () => {
      if (!canMake(note) || this.needs.files.getFileByPath(note.path) !== null) return;
      result = await this.attemptMake(note);
    });
    return result;
  }

  isOutOfStep(note: WantedNote): boolean {
    const file = this.needs.files.getFileByPath(note.path);
    if (file === null || this.memos.isSettled(note)) return false;
    return isOutOfStep(readExistingNote(this.needs.metadata, file, note));
  }

  async idle(path: string): Promise<void> {
    await this.queue.run(path, async () => {});
  }

  noteRead(path: string): void {
    if (this.memos.stopWaiting(path)) void this.queue.run(path, () => this.settle(path));
  }

  private async settle(path: string): Promise<void> {
    const note = this.memos.wantedAt(path);
    if (note === undefined || this.memos.isDone(path, wantedKeyOf(note))) return;
    const file = this.needs.files.getFileByPath(path);
    if (file === null) {
      if (canMake(note)) await this.attemptMake(note);
      return;
    }
    await this.settleExisting(file, note);
  }

  private async settleExisting(file: TFile, note: WantedNote): Promise<void> {
    if (canMake(note) && (await this.needs.files.read(file)) === "") {
      await this.attempt(note, () => this.writer.fill(file, this.linkOf(note), note.lines));
      return;
    }
    const existing = readExistingNote(this.needs.metadata, file, note);
    if (!existing.read) {
      this.memos.waitForRead(note.path);
      return;
    }
    if (!existing.linked) {
      this.said.say(`link:${note.path}`, notLinkedMessage(note));
      return;
    }
    if (note.lines.length === 0 && existing.onlyPluginProperties) {
      await this.attempt(note, () => this.writer.trashOrEmpty(file, !existing.alreadyThere));
      return;
    }
    if (existing.alreadyThere) {
      this.memos.settle(note.path, wantedKeyOf(note));
      return;
    }
    await this.attempt(note, () => this.writer.setLines(file, note.lines));
  }

  private linkOf(note: MakeableNote): string {
    return sessionLinkFor(this.needs.metadata, note.sessionFile, note.path);
  }

  private async attemptMake(note: MakeableNote): Promise<MakeResult> {
    const done = await this.attempt(note, () => this.writer.make(note.path, this.linkOf(note), note.lines));
    if (done) return "made";
    return "failed";
  }

  private async attempt(note: WantedNote, act: () => Promise<void>): Promise<boolean> {
    const key = wantedKeyOf(note);
    try {
      await act();
      this.memos.settle(note.path, key);
      return true;
    } catch (error) {
      this.memos.fail(note.path, key);
      this.said.say(`${note.path}:${key}`, failedMessage(note, error));
      return false;
    }
  }
}
