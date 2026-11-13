import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import { MAIN_CHARACTER_PROPERTY, STANDING_PROPERTY } from "../../layout/standing";
import { quotedYamlOf } from "../../note/properties/helpers/quoted-yaml";
import { propertyLine, PropertySetter } from "../properties/property-setter";
import type { CampaignCast } from "./campaign-cast";
import type { LeavingFiles, SwitchPlan } from "./switch-plan";
import { CAMPAIGN_NOTE_CHANGED, NOTE_MOVED } from "./switch-words";

export class MainSwitch {
  private readonly properties: PropertySetter;

  constructor(
    private readonly files: LeavingFiles,
    private readonly cast: CampaignCast,
    readonly plan: SwitchPlan,
  ) {
    this.properties = new PropertySetter(files);
  }

  async checkStill(notes: readonly TFile[]): Promise<void> {
    for (const note of [this.plan.campaignNote, this.plan.chosen, ...notes]) {
      if (this.files.getFileByPath(note.path) !== note) throw new Refusal(NOTE_MOVED);
    }
    const now = await this.files.read(this.plan.campaignNote);
    if (now !== this.plan.asked) throw new Refusal(CAMPAIGN_NOTE_CHANGED);
  }

  async finish(): Promise<void> {
    await this.properties.set(this.plan.chosen, STANDING_PROPERTY, null);
    await this.properties.setFrom(this.plan.campaignNote, this.plan.asked, MAIN_CHARACTER_PROPERTY, this.mainLine());
  }

  private mainLine(): string {
    const link = this.cast.linkTo(this.plan.chosen, this.plan.campaignNote.path);
    return propertyLine(MAIN_CHARACTER_PROPERTY, quotedYamlOf(`[[${link}]]`));
  }
}
