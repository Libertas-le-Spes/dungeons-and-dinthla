import { Modal, Notice } from "obsidian";
import { messageOf } from "./message-of";
import type { SecondPress } from "./second-press";

export abstract class TrackedDialog extends Modal {
  private busy = false;
  private readonly secondPresses: SecondPress[] = [];

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    for (const secondPress of this.secondPresses) secondPress.stop();
    this.contentEl.empty();
    this.closed();
  }

  protected stopOnClose(secondPress: SecondPress): void {
    this.secondPresses.push(secondPress);
  }

  protected run(change: () => Promise<boolean>, failure: string): void {
    if (this.busy) return;
    this.busy = true;
    change()
      .then((wrote) => {
        this.busy = false;
        this.finished(wrote);
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`${failure}: ${messageOf(error)}`);
        this.failed(error);
      });
  }

  protected abstract finished(wrote: boolean): void;

  protected abstract failed(error: unknown): void;

  protected abstract closed(): void;
}
