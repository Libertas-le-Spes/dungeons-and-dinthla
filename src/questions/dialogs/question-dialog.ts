import type { Telling } from "../../host/showing/telling";
import type { QuestionRecord } from "../../campaign/record/campaign";
import { ButtonRow } from "../../views/components/dialogs/button-row";
import { DeleteButton } from "../../views/components/dialogs/delete-button";
import { MainButton, PlainButton } from "../../views/components/dialogs/dialog-buttons";
import { TextAreaField } from "../../views/components/dialogs/text-area-field";
import { TextField } from "../../views/components/dialogs/text-field";
import type { DialogView, ShownDialog } from "../../views/dialogs/dialog-view";
import { RecordChanging } from "../../views/dialogs/record-changing";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Paragraph } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { QuestionEdit } from "../writing/question-plan";

export interface QuestionChoices {
  save(edit: QuestionEdit): Promise<boolean>;
  reopen(): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface QuestionPlaces {
  askedIn: string;
  answeredIn: string;
  writesTo: string;
}

const FAILURE = "Couldn't change the question";
const DIALOG_CLASSES = ["dd-dialog"];

const ANSWER = { name: "Answer", label: "Answer", placeholder: "Lady Vess sent it, through [[Mira]]" };
const FOLLOW_UP = { name: "Follow-up question (optional)", label: "Follow-up question", placeholder: "Why would she hide it?" };

class AnswerChange implements TextChange {
  constructor(private readonly edit: QuestionEdit) {}

  changed(value: string): void {
    this.edit.answer = value;
  }
}

class FollowUpChange implements TextChange {
  constructor(private readonly edit: QuestionEdit) {}

  changed(value: string): void {
    this.edit.followUp = value;
  }
}

function titleOf(question: QuestionRecord): string {
  if (question.answer === null) return "Answer the question";
  return "Answered question";
}

export class QuestionDialog implements ShownDialog {
  readonly title: string;
  readonly cls = DIALOG_CLASSES;
  private readonly edit: QuestionEdit;
  private readonly changing: RecordChanging;
  private readonly answerHandle = new KeptHandle();

  constructor(
    telling: Pick<Telling, "say">,
    private readonly question: QuestionRecord,
    private readonly places: QuestionPlaces,
    private readonly choices: QuestionChoices,
    onClosed: (changed: boolean) => void,
  ) {
    this.title = titleOf(question);
    this.changing = new RecordChanging(telling, onClosed);
    let answer = "";
    if (question.answer !== null) answer = question.answer.text;
    this.edit = { answer, followUp: "" };
  }

  opened(view: DialogView): void {
    this.changing.opened(view);
    view.show(this.trees());
    this.answerHandle.focus();
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

  private trees(): ViewElement[] {
    const save = new RunAction(this.save.bind(this));
    return [
      new Paragraph({ cls: ["dd-subject"], text: this.question.text }),
      new Paragraph({ cls: ["dd-detail"], text: `Asked in ${this.places.askedIn}` }),
      new TextAreaField(ANSWER, new AnswerChange(this.edit), save).build(this.edit.answer, this.answerHandle),
      new TextField(FOLLOW_UP, new FollowUpChange(this.edit), save).build("", null),
      new Paragraph({ cls: ["dd-where"], text: this.whereWords() }),
      new ButtonRow().build(this.buttons(save)),
    ];
  }

  private buttons(save: RunAction): ViewElement[] {
    const buttons: ViewElement[] = [new MainButton("Save", save).build()];
    if (this.question.answer !== null) buttons.push(new PlainButton("Reopen question", new RunAction(this.reopen.bind(this))).build());
    buttons.push(new PlainButton("Cancel", new RunAction(this.changing.close.bind(this.changing))).build());
    const deleting = new DeleteButton("Delete question", new RunAction(this.delete.bind(this)));
    this.changing.stopOnClose(deleting);
    buttons.push(deleting.build());
    return buttons;
  }

  private whereWords(): string {
    if (this.question.answer === null) return `New lines go into ${this.places.writesTo}.`;
    return `New lines go into ${this.places.writesTo}; a changed answer replaces the old one in ${this.places.answeredIn}.`;
  }

  private save(): void {
    this.changing.run(this.choices.save.bind(this.choices, this.edit), FAILURE);
  }

  private reopen(): void {
    this.changing.run(this.choices.reopen.bind(this.choices), FAILURE);
  }

  private delete(): void {
    this.changing.run(this.choices.delete.bind(this.choices), FAILURE);
  }
}
