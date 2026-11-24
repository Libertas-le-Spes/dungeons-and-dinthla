export interface WriteReport {
  textSaved(path: string, text: string): void;
  trashed(path: string): void;
  renamed(from: string, to: string): void;
}
