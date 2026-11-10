import { Component, type EventRef } from "obsidian";
import type { Fence } from "../fence/fence";
import type { FencedFiles } from "../fence/fenced-files";
import { NoteDrafts } from "../note-editing/note-drafts";
import type { Drafts } from "./drafts";
import { setAsideGoneNotes } from "./gone-notes";
import { KeptDrafts } from "./kept-drafts";

export interface DraftKeepingNeeds {
  files: Pick<FencedFiles, "on" | "offref" | "getFileByPath">;
  fence: Pick<Fence, "holds">;
  campaignsFolder: () => string | null;
  now: () => number;
}

export class DraftKeeping extends Component {
  readonly keptDrafts: KeptDrafts;
  readonly noteDrafts: NoteDrafts;

  constructor(
    drafts: Drafts,
    private readonly needs: DraftKeepingNeeds,
  ) {
    super();
    this.keptDrafts = new KeptDrafts(drafts, needs.now);
    this.noteDrafts = new NoteDrafts(drafts);
  }

  override onload(): void {
    this.listen(this.needs.files.on("rename", (file, oldPath) => this.keptDrafts.noteRenamed(oldPath, file.path)));
    this.listen(this.needs.files.on("rename", (file, oldPath) => this.noteDrafts.moved(oldPath, file.path)));
    this.listen(this.needs.files.on("delete", (file) => this.keptDrafts.noteDeleted(file.path)));
  }

  setAsideGoneNotes(): void {
    setAsideGoneNotes(this.keptDrafts, this.needs.campaignsFolder(), (key) => this.staysLive(key));
  }

  private staysLive(key: string): boolean {
    if (this.noteDrafts.owns(key)) return true;
    if (!this.needs.fence.holds(key)) return true;
    return this.needs.files.getFileByPath(key) !== null;
  }

  private listen(ref: EventRef): void {
    this.register(() => this.needs.files.offref(ref));
  }
}
