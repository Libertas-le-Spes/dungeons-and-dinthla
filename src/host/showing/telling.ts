export interface TellingChoice {
  readonly words: string;
  chosen(): void;
}

export interface Telling {
  say(words: string): void;
  sayUntilDismissed(words: string): void;
  ask(words: string, choices: readonly TellingChoice[]): void;
}
