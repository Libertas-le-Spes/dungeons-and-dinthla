import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { MakeResult } from "../../note-keeping/make-result";
import type { MakerActions, MakerFiles } from "../../note-keeping/new-note-maker";
import { nothingAsync } from "../../note-keeping/nothing";
import { PathQueue } from "../../note-keeping/path-queue";
import { SaidOnce } from "../../note-keeping/said-once";
import { canMake, wantedKeyOf, type MakeableNote, type WantedNote } from "../wanting/wanted-note";
import { readExistingNote, isOutOfStep, type ExistingMetadata } from "./existing-note";
import { ExistingNoteSettler } from "./existing-note-settler";
import { HalfMadeNote } from "./half-made-note";
import { KindNoteWriter } from "./kind-note-writer";
import { NoteAttempts } from "./note-attempts";
import { NoteMemos } from "./note-memos";
import { sessionLinkFor } from "./session-link";

export interface KindNoteKeeperNeeds {
  files: MakerFiles & Pick<FencedFiles, "getFileByPath">;
  metadata: ExistingMetadata;
  actions: MakerActions;
  now(): number;
  say(message: string): void;
}

export class KindNoteKeeper {
  private readonly memos = new NoteMemos();
  private readonly queue = new PathQueue();
  private readonly writer: KindNoteWriter;
  private readonly attempts: NoteAttempts;
  private readonly settler: ExistingNoteSettler;

  constructor(private readonly needs: KindNoteKeeperNeeds) {
    const said = new SaidOnce(needs.say);
    this.writer = new KindNoteWriter(needs.files, needs.actions);
    this.attempts = new NoteAttempts(this.memos, said);
    const halfMade = new HalfMadeNote(needs, this.attempts);
    this.settler = new ExistingNoteSettler({ metadata: needs.metadata, writer: this.writer, memos: this.memos, said, attempts: this.attempts, halfMade });
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
    await this.queue.run(path, nothingAsync);
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
    await this.settler.settle(file, note);
  }

  private async attemptMake(note: MakeableNote): Promise<MakeResult> {
    const done = await this.attempts.attempt(note, () => this.writer.make(note.path, sessionLinkFor(this.needs.metadata, note.sessionFile, note.path), note.lines));
    if (done) return "made";
    return "failed";
  }
}
