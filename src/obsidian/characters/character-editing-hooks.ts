import type { App, Menu, TAbstractFile } from "obsidian";
import { characterAt, editCharacterAt, openEditCharacter, type CharacterEditing } from "../../characters/editing/open-character";
import type { Gate } from "../../fence/gate/gatekeeper";
import type { NoteRef } from "../../host/notes/note-ref";

export type ShownPath = () => string | null;

export function editActiveCharacter(app: App, editing: CharacterEditing, shownPath: ShownPath, checking: boolean): boolean {
  const active = app.workspace.getActiveFile();
  if (active !== null) return editCharacterAt(editing, active.path, checking);
  return editCharacterAt(editing, shownPath(), checking);
}

export function addEditCharacterItem(editing: CharacterEditing, menu: Menu, file: TAbstractFile): void {
  const character = characterAt(editing, file.path);
  if (character === null) return;
  menu.addItem((item) => item.setTitle("Edit character").setIcon("pencil").onClick(() => void openEditCharacter(editing, character)));
}

export async function openMadeNote(app: App, gate: Gate, note: NoteRef): Promise<void> {
  const file = gate.files.getFileByPath(note.path);
  if (file === null) return;
  await app.workspace.getLeaf(false).openFile(file);
}
