import type { CampaignStore } from "../campaign/campaign-store";
import { noteTextsOf } from "../campaign/note-texts";
import type { Gate } from "../fence/gatekeeper";
import type { VaultSettings } from "../fence/vault-settings";
import type { LookupOpeners } from "../kinds/lookup-openers";
import type { NoteEditingNeeds } from "../note-editing/note-editing";
import { NoteSaver } from "../note-editing/note-saver";
import { AppendWriter } from "../session-notes/append-writer";
import type { DraftKeeping } from "../session-notes/draft-keeping";
import type { Drafts } from "../session-notes/drafts";
import { SessionClearer } from "../session-notes/session-clearer";
import { SessionTrash } from "../session-notes/session-trash";
import { deletesPermanently } from "../session-notes/trash-option";
import { sessionPropertiesOf } from "../sessions/session-properties";
import type { OpenConfirm } from "../views/dialogs/confirm-modal";
import type { LinkActions } from "../views/lists/linked-text";
import type { NotesNeeds } from "./notes-section";

export type SessionNotesGate = Gate & { vaultSettings: Pick<VaultSettings, "trashOption"> };

export interface SessionNotesWiringNeeds {
  gate: SessionNotesGate;
  store: CampaignStore;
  drafts: Drafts;
  keeping: Pick<DraftKeeping, "keptDrafts" | "noteDrafts">;
  openers: LookupOpeners;
  actions: LinkActions;
  confirm: OpenConfirm;
  startSession(): void;
}

export interface SessionNotesWiring {
  notes: NotesNeeds;
  wholeText: NoteEditingNeeds;
}

export function sessionNotesWiring(needs: SessionNotesWiringNeeds): SessionNotesWiring {
  const gate = needs.gate;
  const wholeText = { texts: noteTextsOf(gate), drafts: needs.keeping.noteDrafts, saver: new NoteSaver(gate.files) };
  const notes = {
    store: needs.store,
    drafts: needs.drafts,
    keptDrafts: needs.keeping.keptDrafts,
    writer: new AppendWriter(gate.files),
    propertiesOf: (path: string) => sessionPropertiesOf(path, gate.metadata),
    openers: needs.openers,
    actions: needs.actions,
    wholeText,
    removal: {
      clearer: new SessionClearer(gate.files),
      trash: new SessionTrash(gate.files, gate.fileActions, () => deletesPermanently(gate.vaultSettings)),
      confirm: needs.confirm,
    },
    startSession: () => needs.startSession(),
  };
  return { notes, wholeText };
}
