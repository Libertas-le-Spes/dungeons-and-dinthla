import type { ShownPage } from "../views/pages/page-view";
import { NoNotePage } from "./no-note-page";
import { NotePage, type NotePageNeeds } from "./note-page";

export function notePageFor(path: string | null, needs: NotePageNeeds): ShownPage {
  if (path === null) return new NoNotePage();
  return new NotePage(path, needs);
}
