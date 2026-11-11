import { notePageFor } from "../../note-page/note-page-for";
import type { NotePageNeeds } from "../../note-page/note-page";
import type { MakePage } from "../view/campaign-pages";

export function noteSection(needs: NotePageNeeds): MakePage {
  return (contentEl, _show, path) => notePageFor(contentEl, path, needs);
}
