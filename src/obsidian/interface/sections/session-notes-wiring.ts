import type { WantedLines } from "../../../views/opening/wanted-lines";
import type { CampaignStore } from "../../../campaign/reading/campaign-store";
import { HostNoteTexts } from "../../../campaign/reading/note-texts";
import { OBSIDIAN_SYNTAX } from "../../notes/obsidian-syntax";
import type { HostNotes } from "../../../host/host";
import type { LookupOpeners } from "../../../kinds/lookup-openers";
import type { LineOpeners } from "../../../session-notes/lines/line-opener-of";
import type { NoteEditingNeeds } from "../../../note-editing/note-editing";
import { NoteSaver } from "../../../note-editing/note-saver";
import { AppendWriter } from "../../../session-notes/drafts/append-writer";
import type { DraftKeeping } from "../../../session-notes/kept/draft-keeping";
import type { Drafts } from "../../../session-notes/drafts/drafts";
import { SessionClearer } from "../../../session-notes/removal/session-clearer";
import { SessionTrash } from "../../../session-notes/removal/session-trash";
import { SessionRenumbering } from "../../../session-notes/renumbering/session-renumbering";
import { sessionPropertiesOf } from "../../../sessions/session-properties";
import type { OpenConfirm } from "../../../views/dialogs/confirm-dialog";
import type { LinkActions } from "../../../interface/sections/link-actions";
import type { NotesNeeds } from "./notes-section";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export interface SessionNotesWiringNeeds {
  notes: HostNotes;
  store: CampaignStore;
  drafts: Drafts;
  keeping: Pick<DraftKeeping, "keptDrafts" | "noteDrafts">;
  openers: LookupOpeners;
  actions: LinkActions;
  lineOpeners: LineOpeners;
  wantedLines: WantedLines;
  confirm: OpenConfirm;
  campaignFolders(): string[];
  report(message: string): void;
  startSession(): void;
}

export interface SessionNotesWiring {
  notes: NotesNeeds;
  wholeText: NoteEditingNeeds;
}

export function sessionNotesWiring(needs: SessionNotesWiringNeeds, syntax: PropertiesSyntax): SessionNotesWiring {
  const host = needs.notes;
  const wholeText = { texts: new HostNoteTexts(host), drafts: needs.keeping.noteDrafts, saver: new NoteSaver(host.store) };
  const notes = {
    store: needs.store,
    drafts: needs.drafts,
    keptDrafts: needs.keeping.keptDrafts,
    writer: new AppendWriter(host.store, syntax),
    propertiesOf: (path: string) => sessionPropertiesOf(path, host),
    openers: needs.openers,
    actions: needs.actions,
    lineOpeners: needs.lineOpeners,
    wholeText,
    removal: {
      clearer: new SessionClearer(host.store, OBSIDIAN_SYNTAX),
      trash: new SessionTrash(host.store, host.keeping, host.keeping.throwsAwayForGood.bind(host.keeping)),
      renumbering: new SessionRenumbering(host.store, () => needs.campaignFolders(), syntax),
      confirm: needs.confirm,
      report: (message: string) => needs.report(message),
    },
    startSession: () => needs.startSession(),
    wantedLines: needs.wantedLines,
  };
  return { notes, wholeText };
}
