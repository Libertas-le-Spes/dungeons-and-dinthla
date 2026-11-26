import type { Telling } from "../../host/showing/telling";
import { messageOf } from "./message-of";

export type Change = () => Promise<boolean>;

export interface ChangeEnds {
  finished(wrote: boolean): void;
  failed(error: unknown): void;
}

export class ChangeWork {
  private busy = false;
  private change: Promise<void> = Promise.resolve();

  constructor(
    private readonly telling: Pick<Telling, "say">,
    private readonly ends: ChangeEnds,
  ) {}

  isBusy(): boolean {
    return this.busy;
  }

  run(change: Change, failureWords: string): void {
    if (this.busy) return;
    this.busy = true;
    this.change = this.settledOf(change).then(this.wrote.bind(this)).catch(this.refused.bind(this, failureWords));
  }

  settled(): Promise<void> {
    return this.change;
  }

  private async settledOf(change: Change): Promise<boolean> {
    return change();
  }

  private wrote(wrote: boolean): void {
    this.busy = false;
    this.ends.finished(wrote);
  }

  private refused(failureWords: string, error: unknown): void {
    this.busy = false;
    this.telling.say(`${failureWords}: ${messageOf(error)}`);
    this.ends.failed(error);
  }
}
