import { MAIN_CHARACTER_PROPERTY } from "../../layout/standing";
import { quotedYamlOf } from "../../note/properties/helpers/quoted-yaml";
import { writeWhenUnchangedSinceRead } from "../../note/writing/checked-note-text";
import { propertyLine, textWithProperty } from "../properties/property-setter";
import type { PlannedWrite } from "../writes/planned-write";
import type { CampaignCast } from "../cast/campaign-cast";
import type { LeavingFiles, SwitchPlan } from "./switch-plan";
import { campaignNoteFailed, campaignNoteNames } from "./switch-words";

function mainLineOf(link: string): string {
  return propertyLine(MAIN_CHARACTER_PROPERTY, quotedYamlOf(`[[${link}]]`));
}

export class CampaignWrite implements PlannedWrite {
  readonly done: string;
  readonly failed: string;

  constructor(
    private readonly files: LeavingFiles,
    private readonly cast: CampaignCast,
    private readonly plan: SwitchPlan,
  ) {
    const name = plan.chosen.file.basename;
    this.done = campaignNoteNames(name);
    this.failed = campaignNoteFailed(name);
    textWithProperty(plan.asked, MAIN_CHARACTER_PROPERTY, mainLineOf(name));
  }

  async apply(): Promise<void> {
    const link = this.cast.linkTo(this.plan.chosen.file, this.plan.campaignNote.path);
    const after = textWithProperty(this.plan.asked, MAIN_CHARACTER_PROPERTY, mainLineOf(link));
    await writeWhenUnchangedSinceRead(this.files, this.plan.campaignNote.file, this.plan.asked, after);
  }
}
