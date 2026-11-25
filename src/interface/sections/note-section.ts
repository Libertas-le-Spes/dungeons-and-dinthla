import { notePageFor } from "../../note-page/note-page-for";
import type { NotePageNeeds } from "../../note-page/note-page";
import { PageFrame } from "../../obsidian/views/frames/page-frame";
import { PLAIN_KIT } from "../../obsidian/views/mount/mount-kit";
import type { MakePage } from "../view/campaign-pages";

export function noteSection(needs: NotePageNeeds): MakePage {
  return (contentEl, _show, path) => new PageFrame(contentEl, notePageFor(path, needs), PLAIN_KIT);
}
