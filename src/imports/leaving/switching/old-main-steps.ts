import { fallenNotePathOf } from "../../../campaign/paths/campaign-folders";
import { noteAtPathOf } from "../../../campaign/paths/note-at-path";
import { DEPARTED_STANDING, hasLeftPlay, STANDING_PROPERTY } from "../../layout/standing";
import { DEPARTURE_PROPERTY, departureLine } from "../../layout/departure";
import { standingOf } from "../properties/property-value";
import { LineEnding } from "../../note/reading/line-ending";
import { propertyLine, textWithProperty } from "../properties/property-setter";
import type { LeavingSteps } from "../reasons/leaving-reason";
import { departureWordsOf } from "../snapshot/departure-words";
import { heldOf } from "../snapshot/held-by-character";
import { lastDoingOf } from "../snapshot/last-doing";
import { fallenNoteExists } from "../snapshot/snapshot-refusals";
import { withSnapshot } from "../snapshot/snapshot-text";
import { MoveWrite } from "../writes/move-write";
import type { PlannedWrite } from "../writes/planned-write";
import { TextWrite } from "../writes/text-write";
import type { CampaignCast } from "../cast/campaign-cast";
import { isInCharacters } from "../../../campaign/paths/character-membership";
import { textOfNote } from "./read-note";
import type { LeavingActions, LeavingFiles, SwitchPlan } from "./switch-plan";
import { marked, markedWithSnapshot, markFailed, movedToFallen, moveToFallenFailed, NOTE_UNREAD } from "./switch-words";
import type { NoteRef } from "../../../host/notes/note-ref";

interface MarkedNote {
  before: string;
  markedText: string;
  standing: string;
  how: string;
}

export class OldMainSteps implements LeavingSteps {
  constructor(
    private readonly files: LeavingFiles,
    private readonly actions: LeavingActions,
    private readonly cast: CampaignCast,
    private readonly plan: SwitchPlan,
    private readonly old: NoteRef,
    private readonly typedLastDoing: string,
  ) {}

  async intoFallen(standing: string, how: string): Promise<PlannedWrite[]> {
    const before = await textOfNote(this.files, this.old, NOTE_UNREAD);
    const markedText = textWithProperty(before, STANDING_PROPERTY, propertyLine(STANDING_PROPERTY, standing));
    return this.movedWith({ before, markedText, standing, how });
  }

  async departedIntoFallen(typedWords: string): Promise<PlannedWrite[]> {
    const words = departureWordsOf(typedWords);
    const before = await textOfNote(this.files, this.old, NOTE_UNREAD);
    const standingText = textWithProperty(before, STANDING_PROPERTY, propertyLine(STANDING_PROPERTY, DEPARTED_STANDING));
    const markedText = textWithProperty(standingText, DEPARTURE_PROPERTY, departureLine(words.written));
    return this.movedWith({ before, markedText, standing: DEPARTED_STANDING, how: words.snapshot });
  }

  private async movedWith({ before, markedText, standing, how }: MarkedNote): Promise<PlannedWrite[]> {
    const lastDoing = lastDoingOf(this.typedLastDoing);
    const destination = this.fallenPath();
    const campaign = await this.cast.campaignOf(this.plan.campaignFolder);
    const sessionLink = this.cast.latestSessionLink(this.plan.campaignFolder, destination);
    const leaving = { how, day: this.plan.today, sessionLink, lastDoing };
    const after = withSnapshot(markedText, leaving, heldOf(campaign, this.old.basename), LineEnding.of(before));
    return [
      new TextWrite(this.files, this.old, before, after, markedWithSnapshot(this.old.basename, standing), markFailed(this.old.basename)),
      this.moveTo(destination),
    ];
  }

  async markedOnly(standing: string): Promise<PlannedWrite[]> {
    const before = await textOfNote(this.files, this.old, NOTE_UNREAD);
    const after = textWithProperty(before, STANDING_PROPERTY, propertyLine(STANDING_PROPERTY, standing));
    if (after === before) return [];
    return [new TextWrite(this.files, this.old, before, after, marked(this.old.basename, standing), markFailed(this.old.basename))];
  }

  async finishing(): Promise<PlannedWrite[]> {
    if (!isInCharacters(this.old, this.plan.campaignFolder)) return [];
    if (!hasLeftPlay(standingOf(await textOfNote(this.files, this.old, NOTE_UNREAD)))) return [];
    return [this.moveTo(this.fallenPath())];
  }

  private fallenPath(): string {
    const destination = fallenNotePathOf(this.plan.campaignFolder, this.old.basename);
    const taken = noteAtPathOf(this.files.files(), destination);
    if (taken !== null) throw fallenNoteExists(taken.basename);
    return destination;
  }

  private moveTo(destination: string): PlannedWrite {
    return new MoveWrite(this.files, this.actions, this.old, destination, movedToFallen(this.old.basename), moveToFallenFailed(this.old.basename));
  }
}
