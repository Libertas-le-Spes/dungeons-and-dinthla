import type { TFile } from "obsidian";
import type { LeavingReason } from "../reasons/leaving-reason";
import { lastDoingOf } from "../record/last-doing";
import type { CampaignCast } from "./campaign-cast";
import type { MainSwitch } from "./main-switch";
import { OldMainSteps } from "./old-main-steps";
import type { LeavingFiles } from "./switch-plan";
import { finishFailed, finishFailedAfter, partlyAfter, refusalAfter } from "./switch-words";

export interface SwitchChoice {
  readonly words: string;
  run(typedLastDoing: string): Promise<boolean>;
}

export const MAKE_MAIN = "Make main";

export class LeaveAsChoice implements SwitchChoice {
  readonly words: string;

  constructor(
    private readonly files: LeavingFiles,
    private readonly cast: CampaignCast,
    private readonly mainSwitch: MainSwitch,
    private readonly old: TFile,
    private readonly reason: LeavingReason,
  ) {
    this.words = reason.words;
  }

  async run(typedLastDoing: string): Promise<boolean> {
    const lastDoing = lastDoingOf(typedLastDoing);
    await this.mainSwitch.checkStill([this.old]);
    await this.reason.leave(new OldMainSteps(this.files, this.cast, this.mainSwitch.plan, this.old, lastDoing));
    try {
      await this.mainSwitch.finish();
    } catch (error) {
      throw partlyAfter(finishFailedAfter(this.old.basename, this.mainSwitch.plan.chosen.basename), error);
    }
    return true;
  }
}

export class MakeMainChoice implements SwitchChoice {
  readonly words = MAKE_MAIN;

  constructor(private readonly mainSwitch: MainSwitch) {}

  async run(): Promise<boolean> {
    await this.mainSwitch.checkStill([]);
    try {
      await this.mainSwitch.finish();
    } catch (error) {
      throw refusalAfter(finishFailed(this.mainSwitch.plan.chosen.basename), error);
    }
    return true;
  }
}
