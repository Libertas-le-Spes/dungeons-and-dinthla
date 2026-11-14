import { Refusal } from "../../../beyond/shape/refusal";
import type { AskedNote } from "./asked-note";
import type { CampaignCast } from "../cast/campaign-cast";
import { ChosenSteps } from "./chosen-steps";
import { textOfNote } from "./read-note";
import type { LeavingActions, LeavingFiles, SwitchPlan } from "./switch-plan";
import { CAMPAIGN_NOTE_CHANGED, CAMPAIGN_NOTE_UNREAD, NOTE_MOVED } from "./switch-words";
import type { PlannedWrite } from "../writes/planned-write";

export class MainSwitch {
  private readonly chosenSteps: ChosenSteps;

  constructor(
    private readonly files: LeavingFiles,
    actions: LeavingActions,
    cast: CampaignCast,
    readonly plan: SwitchPlan,
  ) {
    this.chosenSteps = new ChosenSteps(files, actions, cast, plan);
  }

  async checkStill(old: AskedNote | null): Promise<void> {
    for (const note of [this.plan.campaignNote, this.plan.chosen]) this.refuseUnlessThere(note);
    if (old !== null) this.refuseUnlessThere(old);
    const now = await textOfNote(this.files, this.plan.campaignNote.file, CAMPAIGN_NOTE_UNREAD);
    if (now !== this.plan.asked) throw new Refusal(CAMPAIGN_NOTE_CHANGED);
  }

  chosenWrites(): Promise<PlannedWrite[]> {
    return this.chosenSteps.writes();
  }

  private refuseUnlessThere(note: AskedNote): void {
    if (!note.isStillThere(this.files)) throw new Refusal(NOTE_MOVED);
  }
}
