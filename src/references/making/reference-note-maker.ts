import type { MakeResult } from "../../note-keeping/make-result";
import { NewNoteMaker, type MakerActions, type MakerFiles } from "../../note-keeping/new-note-maker";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { nameKeyOf } from "../../names/name-key";
import { sessionLinkFor } from "../../kind-notes/keeping/session-link";
import { firstNamedIn } from "./first-named-property";
import type { PlannedReferenceNote } from "./reference-note-plan";

export interface ReferenceNoteMakerNeeds {
  files: MakerFiles & Pick<FencedFiles, "getFileByPath">;
  actions: MakerActions;
  failed(note: PlannedReferenceNote, error: unknown): void;
}

export class ReferenceNoteMaker {
  private readonly maker: NewNoteMaker;
  private readonly reserved = new Set<string>();

  constructor(private readonly needs: ReferenceNoteMakerNeeds) {
    this.maker = new NewNoteMaker(needs.files, needs.actions);
  }

  async make(note: PlannedReferenceNote): Promise<MakeResult> {
    return this.makeIfMissing(note);
  }

  private async makeIfMissing(note: PlannedReferenceNote): Promise<MakeResult> {
    const { files } = this.needs;
    const sessionFile = files.getFileByPath(note.firstSession.path);
    const key = nameKeyOf(note.name);
    if (sessionFile === null || files.getFileByPath(note.path) !== null || this.reserved.has(key)) return "left";
    this.reserved.add(key);
    try {
      await this.maker.make(note.path, firstNamedIn(sessionLinkFor(sessionFile)));
      return "made";
    } catch (error) {
      this.reserved.delete(key);
      this.needs.failed(note, error);
      return "failed";
    }
  }
}
