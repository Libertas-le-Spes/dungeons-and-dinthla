import type { TFile } from "obsidian";
import type { FundsLook, ItemTracking, SettledStatus } from "../../../../src/characters/imported/tracking/item-tracking";

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

export class MadeUpLook implements FundsLook {
  constructor(
    private readonly standings: ReadonlyMap<string, string>,
    private readonly notImported: readonly string[],
  ) {}

  standingOf(written: string): string | null {
    const standing = this.standings.get(written);
    if (standing === undefined) return null;
    return standing;
  }

  heldButNotImported(): readonly string[] {
    return this.notImported;
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

  track(file: TFile, written: string, returnFocus: () => void): void {
    this.tracked.push({ path: file.path, written });
    this.focusReturns.push(returnFocus);
  }

  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void {
    this.settled.push({ path: file.path, name, status });
    this.focusReturns.push(returnFocus);
  }
}
