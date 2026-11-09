import type { App, TAbstractFile, TFile } from "obsidian";

export type NoteChanged = (path: string, text: string) => void;

export type NoteGone = (path: string) => void;

export interface NoteTexts {
  read(path: string): Promise<string | null>;
  onChanged(changed: NoteChanged): () => void;
  onGone(gone: NoteGone): () => void;
}

async function readNote(app: App, path: string): Promise<string | null> {
  const file = app.vault.getFileByPath(path);
  if (file === null) return null;
  return app.vault.read(file);
}

function onChanged(app: App, changed: NoteChanged): () => void {
  const event = app.metadataCache.on("changed", (file: TFile, text: string) => changed(file.path, text));
  return () => app.metadataCache.offref(event);
}

function onGone(app: App, gone: NoteGone): () => void {
  const event = app.vault.on("delete", (file: TAbstractFile) => gone(file.path));
  return () => app.vault.offref(event);
}

export function noteTextsOf(app: App): NoteTexts {
  return {
    read: (path) => readNote(app, path),
    onChanged: (changed) => onChanged(app, changed),
    onGone: (gone) => onGone(app, gone),
  };
}
