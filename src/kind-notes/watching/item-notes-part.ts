import type { MakeTally } from "../../note-keeping/make-result";

export interface ItemNotesPart {
  sessionSaved(): void;
  makeMissing(): Promise<MakeTally>;
}
