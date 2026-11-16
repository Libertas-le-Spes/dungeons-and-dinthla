import type { WantedLines } from "../../views/opening/wanted-lines";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { noteTextsOf } from "../../campaign/reading/note-texts";
import type { Gate } from "../../fence/gate/gatekeeper";
import type { VaultSettings } from "../../fence/gate/vault-settings";
import type { LookupOpeners } from "../../kinds/lookup-openers";
import type { LineOpeners } from "../../session-notes/lines/line-opener-of";
import type { NoteEditingNeeds } from "../../note-editing/note-editing";
import { NoteSaver } from "../../note-editing/note-saver";
import { AppendWriter } from "../../session-notes/drafts/append-writer";
import type { DraftKeeping } from "../../session-notes/kept/draft-keeping";
import type { Drafts } from "../../session-notes/drafts/drafts";
import { SessionClearer } from "../../session-notes/removal/session-clearer";
import { SessionTrash } from "../../session-notes/removal/session-trash";
import { SessionRenumbering } from "../../session-notes/renumbering/session-renumbering";
import { deletesPermanently } from "../../session-notes/removal/trash-option";
import { sessionPropertiesOf } from "../../sessions/session-properties";
import type { OpenConfirm } from "../../views/dialogs/confirm-modal";
import type { LinkActions } from "../../views/lists/linked-text";
import type { NotesNeeds } from "./notes-section";

export type SessionNotesGate = Gate & { vaultSettings: Pick<VaultSettings, "trashOption"> };

export interface SessionNotesWiringNeeds {
  gate: SessionNotesGate;
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
    lineOpeners: needs.lineOpeners,
    wholeText,
    removal: {
      clearer: new SessionClearer(gate.files),
      trash: new SessionTrash(gate.files, gate.fileActions, () => deletesPermanently(gate.vaultSettings)),
      renumbering: new SessionRenumbering(gate.files, () => needs.campaignFolders()),
      confirm: needs.confirm,
      report: (message: string) => needs.report(message),
    },
    startSession: () => needs.startSession(),
    wantedLines: needs.wantedLines,
  };
  return { notes, wholeText };
}
