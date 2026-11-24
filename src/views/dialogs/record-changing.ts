import type { Telling } from "../../host/showing/telling";
import { PartlyWritten } from "../../campaign/writing/note-editor";
import { ChangeWork, type Change, type ChangeEnds } from "./change-work";
import type { DialogView } from "./dialog-view";

export interface Stoppable {
  stop(): void;
}

export class RecordChanging implements ChangeEnds {
  private changed = false;
  private view: DialogView | null = null;
  private readonly stoppables: Stoppable[] = [];
  private readonly work: ChangeWork;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    this.work = new ChangeWork(telling, this);
  }

  opened(view: DialogView): void {
    this.view = view;
  }

  run(change: Change, failureWords: string): void {
    this.work.run(change, failureWords);
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  stopOnClose(stoppable: Stoppable): void {
    this.stoppables.push(stoppable);
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  close(): void {
    if (this.view !== null) this.view.close();
  }

  closed(): void {
    for (const stoppable of this.stoppables) stoppable.stop();
    this.onClosed(this.changed);
  }

  finished(wrote: boolean): void {
    this.changed = wrote;
    this.close();
  }

  failed(error: unknown): void {
    if (!(error instanceof PartlyWritten)) return;
    this.changed = true;
    this.close();
  }
}
