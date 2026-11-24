import type { Telling } from "../../host/showing/telling";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { SuggestField } from "../../views/components/dialogs/suggest-field";
import { TextField } from "../../views/components/dialogs/text-field";
import { ChangeWork, type ChangeEnds } from "../../views/dialogs/change-work";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { NewQuest } from "../writing/new-quest";

const FAILURE = "Couldn't add the quest";
const DIALOG_CLASSES = ["dd-dialog"];

const QUEST = { name: "Quest", label: "Quest", placeholder: "Find the missing caravan" };
const GIVEN_BY = { name: "Given by (optional)", label: "Given by", placeholder: "Lady Vess" };
const REWARD = { name: "Reward (optional)", label: "Reward", placeholder: "200 gp" };

class TitleChange implements TextChange {
  constructor(private readonly entry: NewQuest) {}

  changed(value: string): void {
    this.entry.title = value;
  }
}

class GivenByChange implements TextChange {
  constructor(private readonly entry: NewQuest) {}

  changed(value: string): void {
    this.entry.givenBy = value;
  }
}

class RewardChange implements TextChange {
  constructor(private readonly entry: NewQuest) {}

  changed(value: string): void {
    this.entry.reward = value;
  }
}

export class NewQuestDialog implements ShownDialog, ChangeEnds {
  readonly title = "New quest";
  readonly cls = DIALOG_CLASSES;
  private readonly entry: NewQuest = { title: "", givenBy: "", reward: "" };
  private readonly work: ChangeWork;
  private readonly titleHandle = new KeptHandle();
  private view: DialogView | null = null;

  constructor(
    telling: Pick<Telling, "say">,
    private readonly writesTo: string,
    private readonly characters: readonly string[],
    private readonly add: (entry: NewQuest) => Promise<boolean>,
    private readonly onClosed: () => void,
  ) {
    this.work = new ChangeWork(telling, this);
  }

  opened(view: DialogView): void {
    this.view = view;
    view.show(this.trees());
    this.titleHandle.focus();
  }

  mayClose(): boolean {
    return !this.work.isBusy();
  }

  closed(): void {
    this.onClosed();
  }

  settled(): Promise<void> {
    return this.work.settled();
  }

  finished(wrote: boolean): void {
    if (wrote) this.close();
    else this.titleHandle.focus();
  }

  failed(): void {}

  private trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    const buttons = [new MainButton("Save", save).build(), new PlainButton("Cancel", new RunAction(this.close.bind(this))).build()];
    return [
      new TextField(QUEST, new TitleChange(this.entry), save).build("", this.titleHandle),
      new SuggestField(GIVEN_BY, new GivenByChange(this.entry), this.characters).build(),
      new TextField(REWARD, new RewardChange(this.entry), save).build("", null),
      new Paragraph({ cls: ["dd-where"], text: `Adds a line to ${this.writesTo}.` }),
      new ButtonRow().build(buttons),
    ];
  }

  private close(): void {
    if (this.view !== null) this.view.close();
  }

  private save(): void {
    this.work.run(this.add.bind(this, this.entry), FAILURE);
  }
}
