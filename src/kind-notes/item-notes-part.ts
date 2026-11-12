import type { MakeTally } from "./make-result";

export interface ItemNotesPart {
  sessionSaved(): void;
  makeMissing(): Promise<MakeTally>;
}
