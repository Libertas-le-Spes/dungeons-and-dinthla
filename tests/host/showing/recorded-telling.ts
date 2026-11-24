import type { Telling } from "../../../src/host/showing/telling";

export class RecordedTelling implements Telling {
  readonly said: string[] = [];
  readonly saidUntilDismissed: string[] = [];

  say(words: string): void {
    this.said.push(words);
  }

  sayUntilDismissed(words: string): void {
    this.saidUntilDismissed.push(words);
  }
}
