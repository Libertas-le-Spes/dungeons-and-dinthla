export interface ReferenceNotesPart {
  sessionSaved(path: string): void;
  sessionGone(path: string): void;
}
