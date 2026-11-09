import { SessionNotesPage, type SessionNotesNeeds } from "../session-notes/session-notes-page";
import type { PickerMoves } from "../session-notes/session-picker";
import type { MakePage, ShowPage } from "./campaign-pages";

export interface NotesNeeds extends SessionNotesNeeds {
  startSession(): void;
}

function movesOf(needs: NotesNeeds, show: ShowPage): PickerMoves {
  return {
    showSession: (path) => show({ page: "notes", path }),
    startSession: () => needs.startSession(),
  };
}

export function notesSection(needs: NotesNeeds): MakePage {
  return (contentEl, show, path) => new SessionNotesPage(contentEl, path, needs, movesOf(needs, show));
}
