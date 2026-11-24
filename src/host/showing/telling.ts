export interface Telling {
  say(words: string): void;
  sayUntilDismissed(words: string): void;
}
