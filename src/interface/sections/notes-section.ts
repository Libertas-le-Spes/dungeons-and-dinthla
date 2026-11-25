import { SessionNotesPage, type NotesMoves, type SessionNotesNeeds } from "../../session-notes/page/session-notes-page";
import type { MakePage, ShowPage, StayOn } from "../view/campaign-pages";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";
import { PageFrame } from "../../obsidian/views/frames/page-frame";
import { PLAIN_KIT } from "../../obsidian/views/mount/mount-kit";

export interface NotesNeeds extends SessionNotesNeeds {
  startSession(): void;
}

function movesOf(needs: NotesNeeds, show: ShowPage, stayOn: StayOn): NotesMoves {
  return {
    showSession: (path) => show({ page: "notes", path }),
    showNoSession: () => show({ page: "notes", path: null }),
    startSession: () => needs.startSession(),
    stayOn,
  };
}

export function notesSection(needs: NotesNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show, path, stayOn) => new PageFrame(contentEl, new SessionNotesPage(path, needs, movesOf(needs, show, stayOn), syntax), PLAIN_KIT);
}
