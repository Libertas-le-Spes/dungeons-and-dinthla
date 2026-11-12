import type { TFile } from "obsidian";

export interface WantedNote {
  path: string;
  folder: string;
  sessionPath: string;
  sessionFile: TFile | null;
  lines: string[];
}

export function wantedKeyOf(wanted: WantedNote): string {
  return JSON.stringify(wanted.lines);
}
