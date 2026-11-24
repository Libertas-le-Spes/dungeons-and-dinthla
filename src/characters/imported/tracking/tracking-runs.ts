import type { NoteRef } from "../../../host/notes/note-ref";
import type { ButtonAction } from "../drawing/action-button";
import type { ItemTracking, SheetItem } from "./item-tracking";
import type { SettleChoice } from "./settle-choices";

export class TrackRun implements ButtonAction {
  constructor(
    private readonly file: NoteRef,
    private readonly item: SheetItem,
    private readonly tracking: ItemTracking,
  ) {}

  run(returnFocus: () => void): void {
    this.tracking.track(this.file, this.item, returnFocus);
  }
}

export class SettleRun implements ButtonAction {
  constructor(
    private readonly file: NoteRef,
    private readonly name: string,
    private readonly choice: SettleChoice,
    private readonly tracking: ItemTracking,
  ) {}

  run(returnFocus: () => void): void {
    this.tracking.settle(this.file, this.name, this.choice.status, returnFocus);
  }
}
