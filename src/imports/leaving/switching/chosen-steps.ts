import { noteAtPathOf } from "../../../campaign/paths/note-at-path";
import { STANDING_PROPERTY } from "../../layout/standing";
import { textWithProperty } from "../properties/property-setter";
import { MoveWrite } from "../writes/move-write";
import type { PlannedWrite } from "../writes/planned-write";
import { TextWrite } from "../writes/text-write";
import { CampaignWrite } from "./campaign-write";
import type { CampaignCast } from "../cast/campaign-cast";
import { charactersNotePathOf, isInFallen } from "../../../campaign/paths/character-membership";
import { textOfNote } from "./read-note";
import type { LeavingActions, LeavingFiles, SwitchPlan } from "./switch-plan";
import { charactersNoteExists, markTakenOff, NOTE_UNREAD, markTakeOffFailed, movedToCharacters, moveToCharactersFailed } from "./switch-words";

export class ChosenSteps {
  constructor(
    private readonly files: LeavingFiles,
    private readonly actions: LeavingActions,
    private readonly cast: CampaignCast,
    private readonly plan: SwitchPlan,
  ) {}

  async writes(): Promise<PlannedWrite[]> {
    const chosen = this.plan.chosen.file;
    const before = await textOfNote(this.files, chosen, NOTE_UNREAD);
    const after = textWithProperty(before, STANDING_PROPERTY, null);
    const writes: PlannedWrite[] = [];
    if (isInFallen(chosen, this.plan.campaignFolder)) writes.push(this.moveBack());
    if (!this.plan.chosenIsNamed) writes.push(new CampaignWrite(this.files, this.cast, this.plan));
    if (after !== before) writes.push(new TextWrite(this.files, chosen, before, after, markTakenOff(chosen.basename), markTakeOffFailed(chosen.basename)));
    return writes;
  }

  private moveBack(): PlannedWrite {
    const chosen = this.plan.chosen.file;
    const destination = charactersNotePathOf(this.plan.campaignFolder, chosen.basename);
    const taken = noteAtPathOf(this.files.getFiles(), destination);
    if (taken !== null) throw charactersNoteExists(taken.basename);
    return new MoveWrite(this.files, this.actions, chosen, destination, movedToCharacters(chosen.basename), moveToCharactersFailed(chosen.basename));
  }
}
