export interface ItemNotesPart {
  sessionSaved(): void;
  makeMissing(): Promise<number>;
}
