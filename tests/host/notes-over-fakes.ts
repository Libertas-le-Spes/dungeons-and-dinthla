import { ObsidianNotes } from "../../src/obsidian/notes/obsidian-notes";

export interface GateFakes {
  readonly files: object;
  readonly metadata?: object;
  readonly actions?: object;
  readonly vaultSettings?: object;
}

const NO_METADATA = {};
const NO_ACTIONS = {};
const KEPT_IN_TRASH = { trashOption: () => "local" };

export function notesOverFakes({ files, metadata = NO_METADATA, actions = NO_ACTIONS, vaultSettings = KEPT_IN_TRASH }: GateFakes): ObsidianNotes {
  return new ObsidianNotes({ files, metadata, fileActions: actions, vaultSettings } as never);
}
