import type { Telling } from "../../host/showing/telling";
import type { QuestRecord } from "../../campaign/record/campaign";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { ChoiceField } from "../../views/components/dialogs/choice-field";
import { DeleteButton } from "../../views/components/dialogs/delete-button";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { SwitchField } from "../../views/components/dialogs/switch-field";
import { TextAreaField } from "../../views/components/dialogs/text-area-field";
import { TextField } from "../../views/components/dialogs/text-field";
import { choiceOf } from "../../views/dialogs/choice-of";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { RecordChanging } from "../../views/dialogs/record-changing";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { SwitchChange } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";
import { initialQuestEdit, type QuestEdit, type QuestStatusChoice } from "../writing/quest-plan";

export interface QuestChoices {
  save(edit: QuestEdit): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface QuestPlaces {
  givenIn: string;
  finishedIn: string;
  writesTo: string;
}

const STATUSES = [
  { value: "active", text: "Active" },
  { value: "completed", text: "Completed" },
  { value: "failed", text: "Abandoned" },
];

const STATUS_CHOICES: QuestStatusChoice[] = ["active", "completed", "failed"];

const FAILURE = "Couldn't change the quest";
const DIALOG_CLASSES = ["dd-dialog"];

const HAPPENED = { name: "What happened (optional)", label: "What happened", placeholder: "Found it under the Old Mill; [[Mira]] took the lead" };
const FOLLOW_UP = { name: "Follow-up quest (optional)", label: "Follow-up quest", placeholder: "Return the caravan to [[Lady Vess]]" };

function factsOf(record: QuestRecord): string {
  const facts: string[] = [];
  if (record.quest.givenBy !== undefined) facts.push(`From ${record.quest.givenBy}`);
  if (record.quest.reward !== undefined) facts.push(`Reward ${record.quest.reward}`);
  return facts.join(" · ");
}

class HappenedChange implements TextChange {
  constructor(private readonly edit: QuestEdit) {}

  changed(value: string): void {
    this.edit.happened = value;
  }
}

class FollowUpChange implements TextChange {
  constructor(private readonly edit: QuestEdit) {}

  changed(value: string): void {
    this.edit.followUp = value;
  }
}

class RewardChange implements SwitchChange {
  constructor(private readonly edit: QuestEdit) {}

  flipped(on: boolean): void {
    this.edit.collectReward = on;
  }
}

export class QuestDialog implements ShownDialog, TextChange {
  readonly title = "Quest";
  readonly cls = DIALOG_CLASSES;
  private readonly edit: QuestEdit;
  private readonly changing: RecordChanging;
  private readonly statusHandle = new KeptHandle();
  private readonly happenedHandle = new KeptHandle();
  private readonly rewardRow = new KeptHandle();

  constructor(
    telling: Pick<Telling, "say">,
    private readonly record: QuestRecord,
    private readonly places: QuestPlaces,
    private readonly canCollectReward: boolean,
    private readonly choices: QuestChoices,
    onClosed: (changed: boolean) => void,
  ) {
    this.changing = new RecordChanging(telling, onClosed);
    this.edit = initialQuestEdit(record);
  }

  opened(view: DialogView): void {
    this.changing.opened(view);
    view.show(this.trees());
    this.showRewardRow();
    this.statusHandle.focus();
  }

  mayClose(): boolean {
    return this.changing.mayClose();
  }

  closed(): void {
    this.changing.closed();
  }

  settled(): Promise<void> {
    return this.changing.settled();
  }

  changed(value: string): void {
    const status = choiceOf(STATUS_CHOICES, value);
    if (status === undefined) return;
    this.edit.status = status;
    if (status === "active") this.clearHappened();
    this.showRewardRow();
  }

  private clearHappened(): void {
    if (this.happenedHandle.handle !== null) this.happenedHandle.handle.setValue("");
    this.edit.happened = "";
  }

  private showRewardRow(): void {
    if (this.rewardRow.handle !== null) this.rewardRow.handle.setHidden(this.edit.status !== "completed");
  }

  private trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    const trees: ViewElement[] = [new Paragraph({ cls: ["dd-subject"], text: this.record.quest.title })];
    const facts = factsOf(this.record);
    if (facts !== "") trees.push(new Paragraph({ cls: ["dd-detail"], text: facts }));
    trees.push(
      new Paragraph({ cls: ["dd-detail"], text: `Given in ${this.places.givenIn}` }),
      new ChoiceField("Status", STATUSES, this).build(this.edit.status, this.statusHandle),
      new TextAreaField(HAPPENED, new HappenedChange(this.edit), save).build(this.edit.happened, this.happenedHandle),
    );
    if (this.canCollectReward) trees.push(new SwitchField(`Reward collected: add ${this.record.quest.reward} to the party funds`, new RewardChange(this.edit)).build(this.edit.collectReward, this.rewardRow));
    trees.push(
      new TextField(FOLLOW_UP, new FollowUpChange(this.edit), save).build("", null),
      new Paragraph({ cls: ["dd-where"], text: this.whereWords() }),
      new ButtonRow().build(this.buttons(save)),
    );
    return trees;
  }

  private buttons(save: RunAction): ViewElement[] {
    const deleting = new DeleteButton("Delete quest", new RunAction(this.delete.bind(this)));
    this.changing.stopOnClose(deleting);
    return [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.changing.close.bind(this.changing))).build(), deleting.build()];
  }

  private whereWords(): string {
    if (this.record.outcome === null) return `New lines go into ${this.places.writesTo}.`;
    return `New lines go into ${this.places.writesTo}; a changed outcome, with its reward and follow-up, goes into ${this.places.finishedIn}.`;
  }

  private save(): void {
    this.changing.run(this.choices.save.bind(this.choices, this.edit), FAILURE);
  }

  private delete(): void {
    this.changing.run(this.choices.delete.bind(this.choices), FAILURE);
  }
}
