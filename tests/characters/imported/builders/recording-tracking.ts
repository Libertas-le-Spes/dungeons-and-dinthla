import type { TFile } from "obsidian";
import type { FundsLook, HeldItem, ItemTracking, SettledStatus } from "../../../../src/characters/imported/tracking/item-tracking";

export interface TrackCall {
  path: string;
  written: string;
}

export interface SettleCall {
  path: string;
  name: string;
  status: SettledStatus;
}

export interface LookCall {
  path: string;
  written: readonly string[];
}

export const MADE_UP_ADVICE = "Made-up advice for a character that can't be tracked.";

function heldItemOf(name: string): HeldItem {
  return { name, shown: name };
}

export class MadeUpLook implements FundsLook {
  private readonly trackableAnyway: ReadonlySet<string>;

  constructor(
    private readonly standings: ReadonlyMap<string, string>,
    private readonly notImported: readonly string[],
    trackableAnyway: readonly string[] = [],
  ) {
    this.trackableAnyway = new Set(trackableAnyway);
  }

  standingOf(written: string): string | null {
    const standing = this.standings.get(written);
    if (standing === undefined) return null;
    return standing;
  }

  canTrack(written: string): boolean {
    return this.trackableAnyway.has(written) || !this.standings.has(written);
  }

  heldButNotImported(): readonly HeldItem[] {
    return this.notImported.map(heldItemOf);
  }
}

export class RecordingTracking implements ItemTracking {
  readonly looks: LookCall[] = [];
  readonly tracked: TrackCall[] = [];
  readonly settled: SettleCall[] = [];
  readonly focusReturns: (() => void)[] = [];

  constructor(private readonly look: FundsLook | null) {}

  lookAt(file: TFile, written: readonly string[]): FundsLook | null {
    this.looks.push({ path: file.path, written });
    return this.look;
  }

  whyNotTracked(_file: TFile): string {
    return MADE_UP_ADVICE;
  }

  track(file: TFile, written: string, returnFocus: () => void): void {
    this.tracked.push({ path: file.path, written });
    this.focusReturns.push(returnFocus);
  }

  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void {
    this.settled.push({ path: file.path, name, status });
    this.focusReturns.push(returnFocus);
  }
}
