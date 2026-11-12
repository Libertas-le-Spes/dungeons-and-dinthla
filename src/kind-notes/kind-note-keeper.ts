import type { TFile } from "obsidian";
import { messageOf } from "../views/dialogs/message-of";
import type { FencedFiles } from "../fence/gate/fenced-files";
import type { FencedMetadata } from "../fence/gate/fenced-metadata";
import { KindNoteWriter, type WriterActions, type WriterFiles } from "./kind-note-writer";
import { kindNoteTitleOf } from "./kind-note-path";
import { holdsOnlyPluginProperties, linesIn, sameLines, sessionPropertyIn } from "./note-properties";
import { PathQueue } from "./path-queue";
import { SaidOnce } from "./said-once";
import { linksToSession, sessionLinkFor, type LinkMetadata } from "./session-link";
import { wantedKeyOf, type WantedNote } from "./wanted-note";

export interface KindNoteKeeperNeeds {
  files: WriterFiles & Pick<FencedFiles, "getFileByPath">;
  metadata: LinkMetadata & Pick<FencedMetadata, "getFileCache">;
  actions: WriterActions;
  say(message: string): void;
}

export function notLinkedMessage(wanted: WantedNote): string {
  return `${wanted.path} already exists but isn't linked to its session in its properties, so it was left alone.`;
}

export function failedMessage(wanted: WantedNote, error: unknown): string {
  return `Couldn't write ${kindNoteTitleOf(wanted.folder, wanted.sessionPath)}: ${messageOf(error)}`;
}

function folderOf(path: string): string {
  return path.slice(0, path.lastIndexOf("/"));
}

export class KindNoteKeeper {
  private readonly wanted = new Map<string, WantedNote>();
  private readonly settled = new Map<string, string>();
  private readonly failed = new Map<string, string>();
  private readonly waiting = new Set<string>();
  private readonly queue = new PathQueue();
  private readonly said: SaidOnce;
  private readonly writer: KindNoteWriter;

  constructor(private readonly needs: KindNoteKeeperNeeds) {
    this.said = new SaidOnce(needs.say);
    this.writer = new KindNoteWriter(needs.files, needs.actions);
  }

  keep(notes: WantedNote[]): void {
    for (const note of notes) this.keepOne(note);
  }

  async makeIfMissing(note: WantedNote): Promise<boolean> {
    let made = false;
    await this.queue.run(note.path, async () => {
      const sessionFile = note.sessionFile;
      if (sessionFile === null || note.lines.length === 0) return;
      if (this.needs.files.getFileByPath(note.path) !== null) return;
      made = await this.attempt(note, wantedKeyOf(note), () => this.makeNew(note, sessionFile));
    });
    return made;
  }

  noteRead(path: string): void {
    if (!this.waiting.delete(path)) return;
    void this.queue.run(path, () => this.settle(path));
  }

  private keepOne(note: WantedNote): void {
    this.wanted.set(note.path, note);
    this.settled.delete(note.path);
    void this.queue.run(note.path, () => this.settle(note.path));
  }

  private async settle(path: string): Promise<void> {
    const note = this.wanted.get(path);
    if (note === undefined) return;
    const key = wantedKeyOf(note);
    if (this.failed.get(path) === key || this.settled.get(path) === key) return;
    const file = this.needs.files.getFileByPath(path);
    if (file === null) {
      await this.settleMissing(note, key);
      return;
    }
    await this.settleExisting(file, note, key);
  }

  private async settleMissing(note: WantedNote, key: string): Promise<void> {
    const sessionFile = note.sessionFile;
    if (sessionFile === null || note.lines.length === 0) return;
    await this.attempt(note, key, () => this.makeNew(note, sessionFile));
  }

  private async settleExisting(file: TFile, note: WantedNote, key: string): Promise<void> {
    const cache = this.needs.metadata.getFileCache(file);
    if (cache === null) {
      this.waiting.add(note.path);
      return;
    }
    const session = { path: note.sessionPath, file: note.sessionFile };
    if (!linksToSession(this.needs.metadata, sessionPropertyIn(cache), note.path, session)) {
      this.said.say(`link:${note.path}`, notLinkedMessage(note));
      return;
    }
    if (sameLines(linesIn(cache), note.lines)) {
      this.settled.set(note.path, key);
      return;
    }
    if (note.lines.length === 0 && holdsOnlyPluginProperties(cache)) {
      await this.attempt(note, key, () => this.writer.trashIfNothingOfHis(file));
      return;
    }
    await this.attempt(note, key, () => this.writer.setLines(file, note.lines));
  }

  private async makeNew(note: WantedNote, sessionFile: TFile): Promise<void> {
    const link = sessionLinkFor(this.needs.metadata, sessionFile, note.path);
    await this.writer.make(note.path, folderOf(note.path), link, note.lines);
  }

  private async attempt(note: WantedNote, key: string, act: () => Promise<void>): Promise<boolean> {
    try {
      await act();
      this.settled.set(note.path, key);
      return true;
    } catch (error) {
      this.failed.set(note.path, key);
      this.said.say(`${note.path}:${key}`, failedMessage(note, error));
      return false;
    }
  }
}
