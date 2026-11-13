import type { TFile } from "obsidian";

export type SettledStatus = "held" | "sold" | "used" | "lost";

export interface HeldItem {
  readonly name: string;
  readonly shown: string;
}

export interface FundsLook {
  standingOf(written: string): string | null;
  canTrack(written: string): boolean;
  heldButNotImported(): readonly HeldItem[];
}

export interface ItemTracking {
  lookAt(file: TFile, written: readonly string[]): FundsLook | null;
  whyNotTracked(file: TFile): string;
  track(file: TFile, written: string, returnFocus: () => void): void;
  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void;
}
