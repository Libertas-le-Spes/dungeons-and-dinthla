import type { MakeResult } from "../../note-keeping/make-result";
import { nameKeyOf } from "../../names/name-key";
import type { ReferenceNoteMaker } from "../making/reference-note-maker";
import { plannedReferenceNote } from "../making/reference-note-plan";
import type { NameChosen } from "./new-names-choice";

export interface NewNameAnswersNeeds {
  maker: Pick<ReferenceNoteMaker, "make">;
  askedIn: string;
  campaignFolder(): string | null;
  existingNames(): string[];
}

export class NewNameAnswers {
  constructor(private readonly needs: NewNameAnswersNeeds) {}

  async make({ undecided, kind }: NameChosen): Promise<MakeResult> {
    const { maker, askedIn } = this.needs;
    if (this.needs.campaignFolder() !== askedIn) return "left";
    const key = nameKeyOf(undecided.name);
    if (this.needs.existingNames().some((existing) => nameKeyOf(existing) === key)) return "left";
    return maker.make(plannedReferenceNote({ name: undecided.name, kind, campaignFolder: askedIn, firstSession: undecided.firstSession }));
  }
}
