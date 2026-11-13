import type { TFile } from "obsidian";
import { STANDING_PROPERTY } from "../../layout/standing";
import { propertyLine, PropertySetter } from "../properties/property-setter";
import type { LeavingSteps } from "../reasons/leaving-reason";
import { fallenRecordText } from "../record/fallen-record";
import { fallenRecordPathOf } from "../../../campaign/paths/campaign-folders";
import { RecordWriter } from "../record/record-writer";
import type { CampaignCast } from "./campaign-cast";
import type { LeavingFiles, SwitchPlan } from "./switch-plan";
import { markFailed, markFailedAfterRecord, partlyAfter, recordFailed, refusalAfter } from "./switch-words";

export class OldMainSteps implements LeavingSteps {
  private readonly records: RecordWriter;
  private readonly properties: PropertySetter;

  constructor(
    files: LeavingFiles,
    private readonly cast: CampaignCast,
    private readonly plan: SwitchPlan,
    private readonly old: TFile,
    private readonly lastDoing: string | null,
  ) {
    this.records = new RecordWriter(files);
    this.properties = new PropertySetter(files);
  }

  async recordThenStanding(standing: string, how: string): Promise<void> {
    try {
      await this.records.put(this.plan.campaignFolder, this.old.basename, this.recordText(standing, how));
    } catch (error) {
      throw refusalAfter(recordFailed(this.old.basename), error);
    }
    try {
      await this.markAs(standing);
    } catch (error) {
      throw partlyAfter(markFailedAfterRecord(this.old.basename), error);
    }
  }

  async standingOnly(standing: string): Promise<void> {
    try {
      await this.markAs(standing);
    } catch (error) {
      throw refusalAfter(markFailed(this.old.basename), error);
    }
  }

  private async markAs(standing: string): Promise<void> {
    await this.properties.set(this.old, STANDING_PROPERTY, propertyLine(STANDING_PROPERTY, standing));
  }

  private recordText(standing: string, how: string): string {
    const recordPath = fallenRecordPathOf(this.plan.campaignFolder, this.old.basename);
    const sessionLink = this.cast.newestSessionLink(this.plan.campaignFolder, recordPath);
    return fallenRecordText(this.cast.identityOf(this.old), { standing, how, day: this.plan.today, sessionLink, lastDoing: this.lastDoing });
  }
}
