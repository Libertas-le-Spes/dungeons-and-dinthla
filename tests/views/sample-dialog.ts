import type { App } from "obsidian";
import type { SecondPress } from "../../src/views/second-press";
import { TrackedDialog } from "../../src/views/tracked-dialog";

export const FAILURE = "Couldn't save the sample";

export interface HeldChange {
  finish(wrote: boolean): void;
  fail(error: unknown): void;
}

export class SampleDialog extends TrackedDialog {
  readonly changes: HeldChange[] = [];
  readonly finishedWith: boolean[] = [];
  readonly failedWith: unknown[] = [];
  closedTimes = 0;

  constructor() {
    super({} as App);
  }

  override onOpen(): void {
    this.contentEl.createEl("p", { text: "Sample" });
  }

  save(): void {
    this.run(() => this.heldChange(), FAILURE);
  }

  keep(secondPress: SecondPress): void {
    this.stopOnClose(secondPress);
  }

  changeAt(index: number): HeldChange {
    const change = this.changes[index];
    if (change === undefined) throw new Error(`No change ${index} yet.`);
    return change;
  }

  protected override finished(wrote: boolean): void {
    this.finishedWith.push(wrote);
  }

  protected override failed(error: unknown): void {
    this.failedWith.push(error);
  }

  protected override closed(): void {
    this.closedTimes += 1;
  }

  private heldChange(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.changes.push({ finish: resolve, fail: reject });
    });
  }
}
