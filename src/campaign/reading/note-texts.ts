import type { TFile } from "obsidian";
import { boxTextOf } from "../writing/disk-text";
import type { GoneFile } from "../../fence/gate/fenced-files";
import type { Gate } from "../../fence/gate/gatekeeper";

export type NoteChanged = (path: string, text: string) => void;

export type NoteGone = (path: string) => void;

export interface NoteTexts {
  read(path: string): Promise<string | null>;
  onChanged(changed: NoteChanged): () => void;
  onGone(gone: NoteGone): () => void;
}

async function readNote(gate: Gate, path: string): Promise<string | null> {
  const file = gate.files.getFileByPath(path);
  if (file === null) return null;
  const disk = await gate.files.read(file);
  return boxTextOf(disk);
}

function onChanged(gate: Gate, changed: NoteChanged): () => void {
  const event = gate.metadata.on("changed", (file: TFile, text: string) => changed(file.path, boxTextOf(text)));
  return () => gate.metadata.offref(event);
}

function onGone(gate: Gate, gone: NoteGone): () => void {
  const event = gate.files.on("delete", (file: GoneFile) => gone(file.path));
  return () => gate.files.offref(event);
}

export function noteTextsOf(gate: Gate): NoteTexts {
  return {
    read: (path) => readNote(gate, path),
    onChanged: (changed) => onChanged(gate, changed),
    onGone: (gone) => onGone(gate, gone),
  };
}
