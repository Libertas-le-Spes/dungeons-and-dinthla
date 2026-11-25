import type { Telling, TellingChoice } from "../../../src/host/showing/telling";

export class RecordedTelling implements Telling {
  readonly said: string[] = [];
  readonly saidUntilDismissed: string[] = [];
  readonly asked: { words: string; choices: readonly TellingChoice[] }[] = [];

  say(words: string): void {
    this.said.push(words);
  }

  sayUntilDismissed(words: string): void {
    this.saidUntilDismissed.push(words);
  }

  ask(words: string, choices: readonly TellingChoice[]): void {
    this.asked.push({ words, choices });
  }
}
