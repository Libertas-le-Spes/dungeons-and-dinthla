import type { MakeResult } from "../../note-keeping/make-result";
import { NewNoteMaker, type MakerActions, type MakerFiles } from "../../note-keeping/new-note-maker";
import { ItemNoteBusy } from "./item-note-busy";
import { keyOf } from "./item-note-key";
import { changeFor } from "./item-note-change";
import type { PlannedItemNote } from "./item-note-plan";

export interface ItemNoteMakerNeeds {
  files: MakerFiles;
  actions: MakerActions;
  busy: ItemNoteBusy;
  failed(error: unknown): void;
}

export class ItemNoteMaker {
  private readonly maker: NewNoteMaker;

  constructor(private readonly needs: ItemNoteMakerNeeds) {
    this.maker = new NewNoteMaker(needs.files, needs.actions);
  }

  async make(note: PlannedItemNote): Promise<MakeResult> {
    const { busy } = this.needs;
    if (!note.makes || busy.isWriting(note.path)) return "left";
    const key = keyOf(note.holder, { lines: note.lines, alias: note.alias });
    if (busy.hasFailed(note.path, key)) return "failed";
    busy.startWriting(note.path);
    try {
      await this.maker.make(note.path, changeFor({ holder: note.holder, lines: note.lines, alias: note.alias }));
      return "made";
    } catch (error) {
      busy.fail(note.path, key);
      this.needs.failed(error);
      return "failed";
    } finally {
      busy.stopWriting(note.path);
    }
  }
}
