import { PathQueue } from "../../note-keeping/path-queue";
import type { MakeResult } from "../../note-keeping/make-result";
import { NewNoteMaker, type MakerActions, type MakerFiles } from "../../note-keeping/new-note-maker";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import { sessionLinkFor, type LinkMetadata } from "../../kind-notes/keeping/session-link";
import { firstNamedIn } from "./first-named-property";
import type { PlannedReferenceNote } from "./reference-note-plan";

export interface ReferenceNoteMakerNeeds {
  files: MakerFiles & Pick<FencedFiles, "getFileByPath">;
  metadata: LinkMetadata;
  actions: MakerActions;
  failed(note: PlannedReferenceNote, error: unknown): void;
}

export class ReferenceNoteMaker {
  private readonly maker: NewNoteMaker;
  private readonly queue = new PathQueue();

  constructor(private readonly needs: ReferenceNoteMakerNeeds) {
    this.maker = new NewNoteMaker(needs.files, needs.actions);
  }

  async make(note: PlannedReferenceNote): Promise<MakeResult> {
    let result: MakeResult = "left";
    await this.queue.run(note.path, async () => {
      result = await this.makeIfMissing(note);
    });
    return result;
  }

  private async makeIfMissing(note: PlannedReferenceNote): Promise<MakeResult> {
    const { files, metadata } = this.needs;
    const sessionFile = files.getFileByPath(note.firstSession.path);
    if (sessionFile === null || files.getFileByPath(note.path) !== null) return "left";
    try {
      await this.maker.make(note.path, firstNamedIn(sessionLinkFor(metadata, sessionFile, note.path)));
      return "made";
    } catch (error) {
      this.needs.failed(note, error);
      return "failed";
    }
  }
}
