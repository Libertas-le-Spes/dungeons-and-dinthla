import type { TFile } from "obsidian";
import { writeWhenUnchangedSinceRead } from "../../note/writing/checked-note-text";
import type { NoteFiles } from "../../note/writing/note-files";
import { withPropertyLine } from "./one-property";
import { refuseUnlessOnlyThePropertyChanged } from "./property-read-back";

export function propertyLine(key: string, value: string): string {
  return `${key}: ${value}`;
}

export class PropertySetter {
  constructor(private readonly files: NoteFiles) {}

  async set(file: TFile, key: string, wanted: string | null): Promise<void> {
    const before = await this.files.read(file);
    await this.setFrom(file, before, key, wanted);
  }

  async setFrom(file: TFile, before: string, key: string, wanted: string | null): Promise<void> {
    const after = withPropertyLine(before, key, wanted);
    if (after === before) return;
    refuseUnlessOnlyThePropertyChanged(before, after, key, wanted);
    await writeWhenUnchangedSinceRead(this.files, file, before, after);
  }
}
