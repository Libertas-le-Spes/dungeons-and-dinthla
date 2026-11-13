import type { TFile } from "obsidian";

export type SettledStatus = "held" | "sold" | "used" | "lost";

export interface FundsLook {
  standingOf(written: string): string | null;
  heldButNotImported(): readonly string[];
}

export interface ItemTracking {
  lookAt(file: TFile, written: readonly string[]): FundsLook | null;
  track(file: TFile, written: string, returnFocus: () => void): void;
  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void;
}
