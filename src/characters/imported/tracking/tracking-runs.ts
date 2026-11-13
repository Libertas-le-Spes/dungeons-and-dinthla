import type { TFile } from "obsidian";
import type { ButtonAction } from "../drawing/action-button";
import type { ItemTracking } from "./item-tracking";
import type { SettleChoice } from "./settle-choices";

export class TrackRun implements ButtonAction {
  constructor(
    private readonly file: TFile,
    private readonly written: string,
    private readonly tracking: ItemTracking,
  ) {}

  run(returnFocus: () => void): void {
    this.tracking.track(this.file, this.written, returnFocus);
  }
}

export class SettleRun implements ButtonAction {
  constructor(
    private readonly file: TFile,
    private readonly name: string,
    private readonly choice: SettleChoice,
    private readonly tracking: ItemTracking,
  ) {}

  run(returnFocus: () => void): void {
    this.tracking.settle(this.file, this.name, this.choice.status, returnFocus);
  }
}
