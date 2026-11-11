import type { App } from "obsidian";
import { Notice } from "../../stubs/obsidian";
import type { SecondPress } from "../../../src/views/dialogs/second-press";
import { ChangeDialog } from "../../../src/views/dialogs/change-dialog";

export const FAILURE = "Couldn't save the sample";

export interface HeldChange {
  finish(wrote: boolean): void;
  fail(error: unknown): void;
}

export class SampleDialog extends ChangeDialog {
  readonly changes: HeldChange[] = [];
  readonly finishedWith: boolean[] = [];
  readonly failedWith: unknown[] = [];
  readonly noticesWhenFailed: number[] = [];
  closedTimes = 0;

  constructor(private readonly closesWhenTold: boolean) {
    super({} as App);
  }

  override onOpen(): void {
    this.contentEl.createEl("p", { text: "Sample" });
  }

  save(): void {
    this.runChange(() => this.heldChange(), FAILURE);
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
    if (this.closesWhenTold) this.close();
  }

  protected override failed(error: unknown): void {
    this.failedWith.push(error);
    this.noticesWhenFailed.push(Notice.shown.length);
    if (this.closesWhenTold) this.close();
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
